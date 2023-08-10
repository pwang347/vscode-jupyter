import {
    AsyncTask,
    IDataFrame,
    IResolvedPackageDependencyMap,
    IHistoryItem,
    IDependencyToInstall,
    CodeOutputStreamListener,
    CodeExecutor,
    ColumnType
} from "@dw/messaging";
import { ICompletionResult, INaturalLanguageClient } from "./naturalLanguage";
import { DataImportOperationMap, OperationMap, PreviewStrategy } from "./operations/types";

/**
 * A data wrangler engine that can be used to provide translations.
 */
export interface IWranglerTranslationEngine {
    /**
     * ID of the engine.
     */
    id: string;

    /**
     * Returns the name of the engine.
     */
    getName: (locale: string) => string;

    /**
     * Supported operations for the engine.
     */
    operations: OperationMap;

    /**
     * Supported data import operations for the engine.
     */
    dataImportOperations: DataImportOperationMap;

    /**
     * Prefix for a line comment, e.g. "# " for Python.
     */
    lineCommentPrefix: string;

    /**
     * Different export formats for the generated code.
     */
    codeExporters: {
        [format in WranglerCodeExportFormat]?: (
            variableToWrangle: string,
            historyItems: IHistoryItem[],
            preCode?: string
        ) => AsyncTask<IWranglerCodeExportResultMap[format]>;
    };

    /**
     * Redacts custom raw types.
     */
    redactCustomRawType: (rawType: string) => string;

    /**
     * Stringifies a value.
     */
    stringifyValue: (value: any, type?: ColumnType) => string;
}

/**
 * A data wrangler engine.
 */
export interface IWranglerEngine extends IWranglerTranslationEngine {
    /**
     * Dependencies for the engine.
     */
    packageDependencies?: IPackageDependencyMap;

    /** Packages to display in status bar. This is an ordered list. */
    displayedPackages: string[];

    /**
     * Example code with placeholders for parameterization.
     * `{0}` will be replaced with the wrangling variable, and {1} will be replaced with an example column key.
     */
    codeExample: string;

    /** Whether the engine has been initialized. */
    isInitialized: boolean;

    /** Whether batching is supported. */
    isBatchingSupported: boolean;

    /**
     * Initializes the wrangler engine instance. If force flag is present, then initializes regardless of whether the
     * engine was initialized previously.
     */
    init: (executeCode: CodeExecutor, force?: boolean) => AsyncTask<void>;

    /**
     * Disposes the wrangler engine instance.
     */
    dispose: () => Promise<void> | void;

    /**
     * Prepares a variable for import.
     */
    prepareVariable: (variableName: string) => AsyncTask<void>;

    /**
     * Given an optional hint, generates a variable name matching the stylistic patterns of the engine.
     */
    getDefaultVariableName: (variableNameHint?: string) => string;

    /**
     * Returns a variable name corresponding to a history step.
     */
    getHistoryVariableName: (index: number) => string;

    /**
     * Returns a new, unused variable name.
     */
    getFreshVariableName: () => string;

    /**
     * Deletes the given variable, freeing its resources.
     */
    deleteVariable: (variableName: string) => AsyncTask<void>;

    /**
     * Given a map of required dependencies, find the actual installed versions and whether dependencies are missing.
     */
    resolvePackageDependencies: (dependencies: IPackageDependencyMap) => AsyncTask<IResolvedPackageDependencyMap>;

    /**
     * If implemented, this hook is called instead of the default code executor whenever an operation is executed.
     * Returns the STDOUT as a string.
     */
    customOperationExecutor?: CodeExecutor;

    /**
     * Given a variable name, returns the corresponding data frame payload.
     *
     * `previewDataFrame` can be passed if available to optimize the loading process.
     * For example, stats can be reused after previewing some kinds of operations.
     */
    inspectDataFrameVariable(variableName: string, previewDataFrame?: IDataFrame): AsyncTask<IDataFrame>;

    /**
     * Assigns a variable into a new variable. Optionally allows for copying the data instead of only assigning by reference.
     */
    assignDataFrame(
        oldVariableName: string,
        newVariableName: string,
        options?: { copy?: boolean; delete?: boolean }
    ): AsyncTask<void>;

    /**
     * Given two variable names, returns the corresponding diff data frame payload.
     * Note that the returned `IDataFrame` in this case is marked as a preview data frame and may come with
     * additional grid annotations.
     *
     * The preview strategy provides a hint to the engine to create the proper grid annotations.
     *
     * `previousDataFrame` can be passed if available to optimize the loading process.
     * For example, stats can be reused when previewing some kinds of operations.
     */
    inspectDataFrameVariableDiff(
        variableName: string,
        previousVariableName: string,
        previewStrategy: PreviewStrategy,
        previousDataFrame?: IDataFrame
    ): AsyncTask<IDataFrame>;

    /**
     * Given two variable names, computes the corresponding diff in the kernel state, without returning the data frame.
     *
     * The preview strategy provides a hint to the engine to create the proper grid annotations.
     */
    loadDataframePreviewDiff(
        variableName: string,
        previousVariableName: string,
        previewStrategy: PreviewStrategy
    ): AsyncTask<void>;

    /** Name of the dependency installer. */
    dependencyInstallerName: string;

    /**
     * Returns true if the dependency installer for the engine is available and false otherwise.
     */
    isDependencyInstallerAvailable: () => AsyncTask<boolean>;

    /**
     * Installs and readies the dependency installer.
     */
    setupDependencyInstaller: (outputStream?: CodeOutputStreamListener) => AsyncTask<void>;

    /**
     * Installs the specified dependency.
     */
    installDependency: (
        dependencyToInstall: IDependencyToInstall,
        outputStream?: CodeOutputStreamListener
    ) => AsyncTask<void>;

    /*
     * Recomputes a dataframe using the given history items.
     * Returns a variable name where the result is stored.
     */
    evaluateHistory(variableToWrangle: string, historyItems: IHistoryItem[]): AsyncTask<string>;

    /**
     * Returns a new path relative to the current working directory.
     */
    getRelativePath?: (newDirectory: string) => AsyncTask<string>;

    /**
     * Returns a list of raw types supported by the engine.
     */
    getRawTypes?: (dependencies: IResolvedPackageDependencyMap) => string[];

    /**
     * Different export formats for data.
     */
    dataExporters: {
        [format in WranglerDataExportFormat]?: (varName: string) => AsyncTask<IWranglerDataExportResultMap[format]>;
    };

    /**
     * Get code for batched execution.
     */
    getBatchedCode: (codeToBatch: string[]) => string;

    /**
     * Interpret the result of batched code execution.
     */
    interpretBatchedCode: (
        result: string,
        promises: Array<{
            resolve: (value: string) => void;
            reject: (reason: any) => void;
        }>
    ) => void;

    /**
     * Generates code for an operation given the current context and a natural language prompt.
     */
    createWranglingCompletion: (
        client: INaturalLanguageClient,
        variableName: string,
        dataFrame: IDataFrame,
        prompt: string
    ) => Promise<ICompletionResult>;
}

/**
 * Different formats of data wrangler data exports.
 */
export enum WranglerDataExportFormat {
    /**
     * CSV export for the data frame.
     */
    Csv = "csv",

    /**
     * Parquet export for the data frame.
     */
    Parquet = "parquet"
}

/**
 * Result type of each data export format.
 */
export interface IWranglerDataExportResultMap {
    [WranglerDataExportFormat.Csv]: Uint8Array;
    [WranglerDataExportFormat.Parquet]: Uint8Array;
}

/**
 * Different formats of data wrangler code exports.
 */
export enum WranglerCodeExportFormat {
    /**
     * Wraps all generated code as a function.
     */
    Function = "function"
}

/**
 * Result type of each code export format.
 */
export interface IWranglerCodeExportResultMap {
    [WranglerCodeExportFormat.Function]: string;
}

/**
 * Configuration for a data wrangler engine.
 */
export interface IWranglerEngineConfig {
    /**
     * Optional override of dependency versions.
     */
    packageDependencies?: {
        [packageName: string]: string | undefined;
    };

    /**
     * Number of cells loaded in a single chunk. This value needs to be optimized based on the maximum payload size for kernel messaging.
     * In general, the larger this is indicates that fewer messages need to be exchanged.
     */
    cellsPerChunk?: number;

    /**
     * Whether code should be batched. Defaults to false.
     */
    enableCodeBatching?: boolean;

    /**
     * Time to wait before each code batch in ms. Defaults to 100ms.
     */
    codeBatchingDebounceTimeInMs?: number;
}

/**
 * Mapping of dependency to required version. Note that the format of the version string depends on the engine.
 */
export interface IPackageDependencyMap {
    [packageName: string]: string | undefined;
}
