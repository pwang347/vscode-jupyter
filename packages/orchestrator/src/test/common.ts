import {
    AsyncTask,
    CodeExecutor,
    ErrorCode,
    IDataFrame,
    IError,
    IGridCellEdit,
    IHistoryItem,
    IOperationView,
    IOrchestratorComms,
    IResolvedPackageDependencyMap,
    WranglerContextMenuItem
} from "@dw/messaging";
import { IEngineConstants } from "@dw/messaging/lib/engine";
import { INaturalLanguageClient, IWranglerEngine } from "..";
import { IProseApiClient } from "../prose";

/**
 * Returns a mock comms object.
 */
export function getMockComms(overrides?: Partial<IOrchestratorComms>): IOrchestratorComms {
    const uiOverrides = overrides?.ui;
    const operationOverrides = overrides?.operations;
    const codeOverrides = overrides?.code;
    return {
        ui: {
            raiseError: function <T extends ErrorCode = ErrorCode>(error: IError<T>): void {},
            reset: function (): void {},
            start: function (initialDataFrame: IDataFrame): void {},
            updateConstants: function (engineConstants: IEngineConstants): void {},
            updateDependencies: function (dependencies: IResolvedPackageDependencyMap): void {},
            updateOperations: function (
                operations: IOperationView[],
                operationContextMenuLayout: WranglerContextMenuItem[]
            ): void {},
            updateActiveOperation: function (operationKey?: string, args?: any) {},
            updateHistory: function (historyItems: IHistoryItem[]): void {},
            updateActiveHistoryState: function (historyState?: {
                historyItem?: IHistoryItem;
                dataFrame?: IDataFrame;
            }): void {},
            updateGridCellEdits: function (gridCellEdits: IGridCellEdit[]) {},
            updateDataFrame: function (dataFrame: IDataFrame) {},
            setPreviewAllTheCode: function (value: boolean): void {},
            ...uiOverrides
        },
        operations: {
            completePreviewOperation: function (previewDataFrame: IDataFrame): void {},
            completeCommitOperation: function (resultingDataFrame: IDataFrame): void {},
            completeRejectOperation: function (resultingDataFrame: IDataFrame): void {},
            completeUndoOperation: function (resultingDataFrame: IDataFrame): void {},
            ...operationOverrides
        },
        code: {
            execute: async function (code: string): Promise<string> {
                return "";
            },
            interrupt: async () => {},
            ...codeOverrides
        }
    };
}

/**
 * Returns a mock engine object.
 */
export function getMockEngine(overrides?: Partial<IWranglerEngine>): IWranglerEngine {
    return {
        id: "",
        getName: () => "",
        operations: {} as any,
        dataImportOperations: {} as any,
        lineCommentPrefix: "",
        displayedPackages: [],
        codeExample: "",
        dependencyInstallerName: "pip",
        isInitialized: false,
        isBatchingSupported: true,
        installDependency: () => AsyncTask.resolve(),
        setupDependencyInstaller: () => AsyncTask.resolve(),
        isDependencyInstallerAvailable: () => AsyncTask.resolve(true),
        init: () => AsyncTask.resolve(),
        dispose: function (): void | Promise<void> {},
        getDefaultVariableName: function (variableName?: string): string {
            return "df";
        },
        getHistoryVariableName: function (index): string {
            return `df_${index}`;
        },
        getFreshVariableName: function (): string {
            return "df";
        },
        deleteVariable: () => AsyncTask.resolve({} as any),
        resolvePackageDependencies: () =>
            AsyncTask.resolve({
                satisfied: {},
                unsatisfied: {}
            }),
        inspectDataFrameVariable: () => AsyncTask.resolve({} as any),
        inspectDataFrameVariableDiff: () => AsyncTask.resolve({} as any),
        loadDataframePreviewDiff: () => AsyncTask.resolve(),
        assignDataFrame: () => AsyncTask.resolve(),
        evaluateHistory: () => AsyncTask.resolve(""),
        redactCustomRawType: function (): string {
            return "";
        },
        stringifyValue: function (value): string {
            return JSON.stringify(value);
        },
        dataExporters: {},
        codeExporters: {},
        getBatchedCode: (codeToBatch) => codeToBatch.join("\n"),
        interpretBatchedCode: () => {},
        createWranglingCompletion: async () => ({ code: "COMPLETION", foundNullCharacter: false }),
        prepareVariable: () => AsyncTask.resolve(),
        ...overrides
    };
}

/**
 * Returns a mock PROSE API client.
 */
export function getMockProseApiClient(overrides?: Partial<IProseApiClient>): IProseApiClient {
    return {
        deriveColumn: async () => {
            return {
                success: true,
                derivedProgram: "",
                derivedPrograms: { pandas: "" },
                columnsUsed: [],
                significantInputs: []
            };
        },
        ...overrides
    };
}

/**
 * Returns a mock natural language client.
 */
export function getMockNaturalLanguageClient(overrides?: Partial<INaturalLanguageClient>): INaturalLanguageClient {
    return {
        isConfigured: async () => true,
        getNotConfiguredMessage: () => "Not configured",
        createCompletion: async () => ({ code: "Completion", foundNullCharacter: false }),
        addPromptToHistory: () => {},
        getParams: () => ({
            includeColumnContext: false,
            includeDataContext: false,
            maxTokens: 2000
        }),
        ...overrides
    };
}

/**
 * String formatter.
 */
export function formatString(base: string, ...args: any[]) {
    return base.replace(/{(\d+)}/g, (match, number) => (args[number] === undefined ? match : args[number]));
}
