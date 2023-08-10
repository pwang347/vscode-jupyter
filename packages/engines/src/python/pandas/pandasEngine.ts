import {
    IWranglerEngine,
    IPackageDependencyMap,
    WranglerCodeExportFormat,
    WranglerDataExportFormat,
    PreviewStrategy,
    INaturalLanguageClient,
    ICompletionResult
} from "@dw/orchestrator";
import { PandasOperations } from "./operations";
import {
    IDataFrame,
    IHistoryItem,
    IDependencyToInstall,
    IDataFrameHeader,
    getDataFrameLoader,
    IDataFrameColumnStats,
    IDataFrameStats,
    PreviewAnnotationType,
    MinimumRowChunkSize,
    CodeOutputStreamListener,
    CodeExecutor,
    ICodeExecutorOptions,
    AsyncTask,
    ColumnType
} from "@dw/messaging";
import {
    initializeSession,
    getPackageDependencies as getPackageDependenciesFromCompute,
    getDataFrameInfo,
    getDataFrameRows,
    loadDataFrameDiff,
    executeIsolatedOperation,
    disposeSession,
    copyVariableToSessionLocals,
    getDataFrameHeaderStats,
    getDataFrameColumnStats,
    installDependency,
    isPipAvailable,
    ensurePip,
    getCsv,
    getParquet,
    IGetDataframeRowsCursor,
    getRelativePath,
    deleteVariable,
    getIsolatedOperationCode,
    getRemovePreviewItemCode,
    getDeleteLocalVariableCode
} from "./computeHelpers";
import { WranglerEngineIdentifier } from "../../types";
import { PythonPackageInstallers } from "./types";
import { createWranglingCompletion } from "./naturalLanguage";
import { PandasDataImportOperations } from "./operations/dataImport";
import { buildCleaningCode, getCleanedVarName } from "../codeExportHelpers";
import { redactRawType } from "./operations/util";
import { toPythonValueString } from "../util";

/**
 * An engine based on Python with Pandas.
 */
export class PandasEngine implements IWranglerEngine {
    constructor(
        private maxRowsPerChunk = 1000,
        private maxCharsPerChunk = 1_000_000,
        private enablePySparkConversion = false
    ) {}

    /** Whether batching is supported */
    public isBatchingSupported: boolean = true;

    /** The ID of the engine */
    public readonly id = WranglerEngineIdentifier.Pandas;

    /** The name of the engine */
    public getName = () => "pandas";

    /** Dependencies for the engine */
    public readonly packageDependencies = {
        pandas: "0.25.2",

        // this is used by PROSE for Flash Fill
        regex: "2020.11.13",

        // used for PySpark to Pandas conversion
        pyspark: this.enablePySparkConversion ? "2.4.0" : undefined
    };

    /** Packages to display in status bar. This is an ordered list. */
    public readonly displayedPackages = ["pandas"];

    /** The name of the package installer */
    public dependencyInstallerName = PythonPackageInstallers.Pip;

    /** Whether the engine has been initialized */
    public isInitialized: boolean = false;

    /** Supported operations */
    public readonly operations = PandasOperations;

    /** Supported data import operations */
    public readonly dataImportOperations = PandasDataImportOperations;

    /** Data export formats */
    public readonly dataExporters = {
        [WranglerDataExportFormat.Csv]: this.exportDataAsCSV.bind(this),
        [WranglerDataExportFormat.Parquet]: this.exportDataAsParquet.bind(this)
    };

    /** Code export formats */
    public readonly codeExporters = {
        [WranglerCodeExportFormat.Function]: this.exportCodeAsFunction.bind(this)
    };

    /** Prefix for line comments */
    public readonly lineCommentPrefix = "# ";

    /** Example code */
    public readonly codeExample = "{0} = {0}.drop(columns=[{1}])";

    /** Code executor */
    private executeCode?: CodeExecutor;

    /** Session ID corresponding to this instance */
    private sessionId?: string;

    /** Counter used to generate fresh variable names. */
    private freshVariableId = 0;

    /**
     * Code to be executed when the engine is initialized.
     */
    public init = AsyncTask.factory("init", async (subtask, executeCode: CodeExecutor, force?: boolean) => {
        // don't initialize multiple times
        if (!this.isInitialized && !force) {
            return;
        }
        this.executeCode = executeCode;
        const initResult = await subtask(initializeSession(executeCode));
        this.sessionId = initResult.sessionId;
        this.dependencyInstallerName = initResult.isPyodideEnv
            ? PythonPackageInstallers.Micropip
            : initResult.isCondaEnv
            ? PythonPackageInstallers.Conda
            : PythonPackageInstallers.Pip;
        this.isInitialized = true;
    });

    /**
     * Disposes the engine instance.
     */
    public async dispose() {
        if (!this.sessionId || !this.executeCode) {
            this.isInitialized = false;
            return;
        }
        await disposeSession(this.executeCode, this.sessionId);
        this.isInitialized = false;
    }

    /**
     * Creates the starting variable with an optional hint.
     */
    public getDefaultVariableName(variableNameHint?: string | undefined): string {
        if (variableNameHint) {
            return variableNameHint;
        }
        return "df";
    }

    /**
     * Returns a variable name corresponding to a history step.
     */
    public getHistoryVariableName(index: number): string {
        return `_DW_${index}`;
    }

    /**
     * Returns a new, unused variable name.
     */
    public getFreshVariableName(): string {
        return `_${this.freshVariableId++}`;
    }

    /**
     * Deletes the given variable, freeing its resources.
     */
    public deleteVariable(variableName: string): AsyncTask<void> {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        return deleteVariable(this.executeCode, this.sessionId, variableName).then();
    }

    /**
     * Returns the list of satistied and missing package dependencies.
     */
    public resolvePackageDependencies = AsyncTask.factory(
        "resolvePackageDependencies",
        async (subtask, dependencies: IPackageDependencyMap) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }
            return await subtask(getPackageDependenciesFromCompute(this.executeCode, this.sessionId, dependencies));
        }
    );

    /**
     * Executes operation code in an isolated session.
     */
    public customOperationExecutor(code: string, options?: ICodeExecutorOptions) {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        return executeIsolatedOperation(this.executeCode, this.sessionId, code, options);
    }

    /**
     * Given a variable name, returns the corresponding dataframe struct.
     */
    public inspectDataFrameVariable = AsyncTask.factory(
        "inspectDataFrameVariable",
        async (subtask, variableName: string, previewDataFrame?: IDataFrame) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }
            const dataframeInfo = await subtask(getDataFrameInfo(this.executeCode, this.sessionId, variableName));
            dataframeInfo.variableName = variableName;
            return subtask(this.wrapDataFrameHeader(dataframeInfo, previewDataFrame));
        }
    );

    /**
     * Given the current and previous variable names, computes and returns a diff dataframe struct.
     */
    public inspectDataFrameVariableDiff = AsyncTask.factory(
        "inspectDataFrameVariableDiff",
        async (
            subtask,
            variableName: string,
            previousVariableName: string,
            previewStrategy: PreviewStrategy,
            previousDataFrame?: IDataFrame
        ) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }
            const dataframeInfo = await subtask(
                getDataFrameInfo(this.executeCode, this.sessionId, variableName, previousVariableName, previewStrategy)
            );
            dataframeInfo.variableName = variableName;
            dataframeInfo.oldVariableName = previousVariableName;
            return subtask(this.wrapDataFrameHeader(dataframeInfo, previousDataFrame));
        }
    );

    /**
     * Given the current and previous variable names, this computes a diff dataframe struct and keeps it in the kernel state, without returning it.
     */
    public loadDataframePreviewDiff = AsyncTask.factory(
        "loadDataframePreviewDiff",
        async (subtask, variableName: string, previousVariableName: string, previewStrategy: PreviewStrategy) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }
            await subtask(
                loadDataFrameDiff(this.executeCode, this.sessionId, variableName, previousVariableName, previewStrategy)
            );
            return;
        }
    );

    /**
     * Performs a full clone of a variable into a new variable.
     */
    public assignDataFrame(
        oldVariableName: string,
        newVariableName: string,
        options?: { copy?: boolean; delete?: boolean }
    ): AsyncTask<void> {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }

        // IMPORTANT
        // whenever a variable gets replaced, we need to make sure we're removing the associated
        // previews to it otherwise we will get a memory leak
        const deletePreview = getRemovePreviewItemCode(this.sessionId, newVariableName);
        const copy = options?.copy ? ".copy()" : "";
        const assignCode = `${newVariableName} = ${oldVariableName}${copy}`;
        const isolatedAssignCode = getIsolatedOperationCode(this.sessionId, assignCode);
        const deleteOldVar = options?.delete ? getDeleteLocalVariableCode(this.sessionId, oldVariableName) : "";
        return this.executeCode(`${deletePreview}\n${isolatedAssignCode}\n${deleteOldVar}`)
            .withName("assignDataFrame")
            .then();
    }

    /**
     * Reconstructs a dataframe from the given history items.
     */
    public evaluateHistory = AsyncTask.factory(
        "evaluateHistory",
        async (subtask, variableToWrangle: string, historyItems: IHistoryItem[]) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }

            const isExternalVariable = this.isLoadedFromVariable(historyItems);
            const outputVar = this.getFreshVariableName();

            // We only need to copy the data if it comes from an external variable so that we don't modify it
            const code =
                buildCleaningCode(
                    variableToWrangle,
                    this.lineCommentPrefix,
                    outputVar,
                    historyItems,
                    isExternalVariable
                ) + `\ndel clean_data, ${variableToWrangle}`;

            // If the original dataframe was loaded from a variable, copy it into the locals again.
            if (isExternalVariable) {
                // This assumes that `variableToWrangle` has the same name as the external variable.
                // This is currently true, but could potentially change.
                await subtask(copyVariableToSessionLocals(this.executeCode, this.sessionId, variableToWrangle));
            }
            await subtask(this.customOperationExecutor(code));

            return outputVar;
        }
    );

    /**
     * Returns true if installer is available or false otherwise.
     */
    public isDependencyInstallerAvailable = AsyncTask.factory("isDependencyInstallerAvailable", async (subtask) => {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        if (
            this.dependencyInstallerName === PythonPackageInstallers.Micropip ||
            this.dependencyInstallerName === PythonPackageInstallers.Conda
        ) {
            return true;
        }
        return subtask(isPipAvailable(this.executeCode, this.sessionId));
    });

    /**
     * Ensures that installer is installed.
     */
    public setupDependencyInstaller = AsyncTask.factory(
        "setupDependencyInstaller",
        async (subtask, outputStream?: CodeOutputStreamListener) => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }
            if (
                this.dependencyInstallerName === PythonPackageInstallers.Micropip ||
                this.dependencyInstallerName === PythonPackageInstallers.Conda
            ) {
                return;
            }
            await subtask(ensurePip(this.executeCode, this.sessionId, { outputStream }));
        }
    );

    /**
     * Installs the specified dependency.
     */
    public installDependency(dependencyToInstall: IDependencyToInstall, outputStream?: CodeOutputStreamListener) {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }

        // always just attempt to install the latest available
        // if the dependency specified has a version, we'll use that as the minimum version to install
        const packageNameWithVersion = `${dependencyToInstall.packageName}${
            dependencyToInstall.version ? `>=${dependencyToInstall.version}` : ""
        }`;

        const cancellable = installDependency(
            this.executeCode,
            this.sessionId,
            packageNameWithVersion,
            this.dependencyInstallerName,
            { outputStream }
        );

        return cancellable.then<void>();
    }

    private isLoadedFromVariable(historyItems: IHistoryItem[]): boolean {
        if (!historyItems.length) {
            return false;
        }
        return historyItems[0].code === "";
    }

    private exportDataAsCSV(variableName: string) {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        return getCsv(this.executeCode, this.sessionId, variableName, this.maxCharsPerChunk);
    }

    private exportDataAsParquet(variableName: string) {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        return getParquet(this.executeCode, this.sessionId, variableName, this.maxCharsPerChunk);
    }

    private exportCodeAsFunction(variableToWrangle: string, historyItems: IHistoryItem[], preCode?: string) {
        if (historyItems.length === 0) {
            return AsyncTask.resolve("");
        }

        const cleanedVarName = getCleanedVarName(variableToWrangle);

        return AsyncTask.resolve(
            `${preCode ?? ""}${buildCleaningCode(
                variableToWrangle,
                this.lineCommentPrefix,
                cleanedVarName,
                historyItems,
                true
            )}\n${cleanedVarName}.head()`
        );
    }

    /**
     * Fetches the rows in chunks.
     */
    private wrapDataFrameHeader = AsyncTask.factory(
        "wrapDataFrameHeader",
        async (subtask, header: IDataFrameHeader, previousDataFrame?: IDataFrame): Promise<IDataFrame> => {
            if (!this.sessionId || !this.executeCode) {
                throw new Error("Not initialized");
            }

            const { stats, columnStats } = this.mapStatsFromOldDataframe(header, previousDataFrame);

            const df: IDataFrame = getDataFrameLoader(
                header,
                {
                    loadRows: (cursor?: IGetDataframeRowsCursor) =>
                        getDataFrameRows(
                            this.executeCode!,
                            this.sessionId!,
                            // Note that we need to reference the variable name from `df` and not `header` here
                            // as they are distinct objects and the variable is modified by the orchestrator when accepting a preview.
                            df.variableName,
                            header.isPreview || false,
                            cursor,
                            this.maxRowsPerChunk,
                            this.maxCharsPerChunk
                        ),
                    loadStats: () =>
                        getDataFrameHeaderStats(
                            this.executeCode!,
                            this.sessionId!,
                            df.variableName,
                            header.isPreview || false
                        ),
                    loadColumnStats: (index: number) =>
                        getDataFrameColumnStats(
                            this.executeCode!,
                            this.sessionId!,
                            df.variableName,
                            header.isPreview || false,
                            index
                        ),
                    getCursorForRow: (rowIndex: number) => ({
                        rowIndex,
                        inlineIndex: 0,
                        partialRow: ""
                    })
                },
                {
                    stats,
                    columnStats
                }
            );

            // Start by loading one "chunk" of rows -- this should be at least enough to fill the grid viewport immediately.
            await subtask(df.loadRows(MinimumRowChunkSize));
            return df;
        }
    );

    /*
     * For some kinds of previews we can reuse stats.
     * This method maps stats from the old dataframe to the new one as much as possible.
     */
    private mapStatsFromOldDataframe(currentDataFrame: IDataFrameHeader, previousDataFrame?: IDataFrame) {
        const columnStats: Record<number, IDataFrameColumnStats> = {};
        let stats: IDataFrameStats | null = null;

        const previewStrategy = currentDataFrame.previewStrategy || previousDataFrame?.previewStrategy;

        if (!previousDataFrame || !previewStrategy) {
            return { stats, columnStats };
        }

        // Reuse header stats
        if (previewStrategy === PreviewStrategy.NoneWithCachedStats) {
            stats = previousDataFrame.tryGetStats();
        }

        // Reuse column stats
        if (
            previewStrategy === PreviewStrategy.ModifiedColumns ||
            previewStrategy === PreviewStrategy.SideBySide ||
            previewStrategy === PreviewStrategy.NoneWithCachedStats
        ) {
            const previousColumnStats = previousDataFrame.getLoadedColumnStats();

            if (currentDataFrame.isPreview) {
                // Map from regular dataframe to preview.
                let previewIndex = 0;
                let oldColumnCount = 0;
                for (const column of currentDataFrame.columns) {
                    const isInOldDataFrame = column.annotations?.annotationType !== PreviewAnnotationType.Added;
                    if (isInOldDataFrame) {
                        // Account for potential reordering of columns
                        const oldIndex = previousDataFrame.columns.findIndex((col) => col.key === column.key);
                        if (previousColumnStats[oldIndex]) {
                            columnStats[previewIndex] = previousColumnStats[oldIndex];
                        }
                        oldColumnCount++;
                    }
                    previewIndex++;
                }

                // Sanity check
                if (oldColumnCount !== previousDataFrame.columns.length) {
                    throw new Error("Did not find all columns in preview dataframe");
                }
            } else {
                // Map from preview to regular dataframe.
                let previewIndex = 0;
                let newIndex = 0;
                for (const column of previousDataFrame.columns) {
                    const isInNewDataFrame = column.annotations?.annotationType !== PreviewAnnotationType.Removed;
                    if (isInNewDataFrame) {
                        // Note that we assume the new column order will be the same as in the preview.
                        // We cannot use the column keys as they may not be unique in a preview dataframe.
                        if (previousColumnStats[previewIndex]) {
                            columnStats[newIndex] = previousColumnStats[previewIndex];
                        }
                        newIndex++;
                    }
                    previewIndex++;
                }

                // Sanity check
                if (newIndex !== currentDataFrame.columns.length) {
                    throw new Error("Did not find all columns in preview dataframe");
                }
            }
        }

        return { stats, columnStats };
    }

    /**
     * Returns the path relative to the working directory.
     */
    public getRelativePath(newDirectory: string) {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        return getRelativePath(this.executeCode, this.sessionId, newDirectory);
    }

    /**
     * Indents Python code.
     */
    public indentCode(code: string, indents: number) {
        const indentString = "    ".repeat(indents);
        let idx = 0;
        let rsf = "";
        const addChar = () => {
            rsf += code[idx];
            idx++;
        };
        while (idx < code.length) {
            if (code[idx] === "\n") {
                addChar();
                rsf += indentString;
            }
            // hack: this handles both ' and ''' by fast-forwarding
            // until we see the next occurence of it
            else if (code[idx] === "'") {
                while (idx < code.length) {
                    addChar();
                    if (code[idx] === "'") {
                        addChar();
                        break;
                    }
                }
            }
            // hack: this handles both " and """ by fast-forwarding
            // until we see the next occurence of it
            else if (code[idx] === '"') {
                while (idx < code.length) {
                    addChar();
                    if (code[idx] === '"') {
                        addChar();
                        break;
                    }
                }
            } else {
                addChar();
            }
        }
        return rsf;
    }

    /**
     * Perform batched code execution.
     */
    public getBatchedCode(codeToBatch: string[]) {
        let batchedCode = `
def __DW_BATCH__():
    from IPython.utils.capture import capture_output
    import json
    results = []
    ${codeToBatch
        .map(
            (code) => `
    with capture_output() as out:
        try:
            ${this.indentCode(code, 3)}
            results.append([1,out.stdout])
        except Exception as e:
            import sys
            from IPython.core.ultratb import ColorTB
            err_type, err_message, err_traceback = sys.exc_info()
            results.append([0,json.dumps({
                "name": str(err_type.__name__),
                "message": str(err_message),
                "stack": ColorTB().text(err_type, err_message, err_traceback)
            })])
`
        )
        .join("\n")}
    print(json.dumps(results))
__DW_BATCH__()
del __DW_BATCH__
`;
        return batchedCode;
    }

    /**
     * Interpret the result of batched code execution.
     */
    public interpretBatchedCode(
        result: string,
        promises: Array<{ resolve: (value: string) => void; reject: (reason: any) => void }>
    ) {
        const resultsParsed = JSON.parse(result);
        for (let i = 0; i < resultsParsed.length; i++) {
            const [succeededBit, value] = resultsParsed[i];
            if (Boolean(succeededBit)) {
                promises[i].resolve(value);
            } else {
                const error = JSON.parse(value);
                promises[i].reject(error);
            }
        }
    }

    /**
     * Generates code for an operation given the current context and a natural language prompt.
     */
    public async createWranglingCompletion(
        client: INaturalLanguageClient,
        variableName: string,
        dataFrame: IDataFrame,
        prompt: string
    ): Promise<ICompletionResult> {
        return createWranglingCompletion(client, variableName, dataFrame, prompt);
    }

    /**
     * Copies the variable to the session locals.
     */
    public prepareVariable = AsyncTask.factory("prepareVariable", async (subtask, variableName: string) => {
        if (!this.sessionId || !this.executeCode) {
            throw new Error("Not initialized");
        }
        subtask(copyVariableToSessionLocals(this.executeCode, this.sessionId, variableName));
    });

    /**
     * Redacts custom raw types.
     */
    public redactCustomRawType(rawType: string) {
        return redactRawType(rawType);
    }

    /**
     * Stringifies a value.
     */
    public stringifyValue(value: any, type?: ColumnType) {
        const pythonValue = toPythonValueString(value, type);
        return pythonValue.displayValue ?? pythonValue.value;
    }
}
