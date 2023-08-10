import {
    IDependencyToInstall,
    IDataFrame,
    IGridCellEdit,
    ISelection,
    IOperationContextMenuItemIdentifier,
    AsyncTask,
    CodeOutputStreamListener,
    CodeExecutor,
    DataImportOperationKey,
    IExportCodeOptions
} from "@dw/messaging";
import {
    IWranglerCodeExportResultMap,
    IWranglerDataExportResultMap,
    WranglerCodeExportFormat,
    WranglerDataExportFormat
} from "./engines";
import { IWranglerStartSessionBaseContext } from "./context";
import { IOperation } from "./operations/types";
import { IOrchestratorHistoryItem } from "./history";
import { ICompletionResult, INaturalLanguageClient } from "./naturalLanguage";

/**
 * A data wrangler orchestrator.
 */
export interface IDataWranglerOrchestrator {
    /**
     * Disposes the current wrangler session.
     */
    dispose: () => Promise<void>;

    /**
     * Initializes the data wrangler.
     */
    startWranglerSession: (
        engine: string,
        operationKey: DataImportOperationKey,
        getDataImportArgs: (context: IWranglerStartSessionBaseContext) => any
    ) => AsyncTask<void>;

    /**
     * Returns true if the specified engine is supported.
     */
    isEngineSupported: (engineId: string) => boolean;

    /**
     * Returns the ID of the active engine or undefined.
     */
    getActiveEngine: () => string | undefined;

    /**
     * Returns the target variable for wrangling.
     */
    getVariableToWrangle: () => string | undefined;

    /**
     * Clears out the history list and notifies the view to reset.
     */
    resetSession: () => void;

    /**
     * Propagates current engine operations to the UI.
     */
    updateOperationsInView: (engineId: string) => void;

    /**
     * Update locale. This is primarily used for rendering operation descriptions.
     */
    updateLocale: (locale: string) => void;

    /**
     * Starts previewing an operation.
     */
    startPreview: (
        operationKey: string,
        args: any,
        dataFrame: IDataFrame,
        gridCellEdits: IGridCellEdit[]
    ) => AsyncTask<void>;

    /**
     * Returns args corresponding to an operation from a context menu item.
     */
    getArgsForContextMenu: (
        selection: ISelection,
        id: IOperationContextMenuItemIdentifier,
        dataFrame: IDataFrame
    ) => any;

    /**
     * Accepts an operation preview.
     */
    acceptPreview: () => AsyncTask<void>;

    /**
     * Rejects an operation preview.
     */
    rejectPreview: (options?: {
        rejectedDueToError?: boolean;
        erroringCode?: string;
        clearOperation?: boolean;
    }) => AsyncTask<void>;

    /**
     * Undo's the last history operation.
     */
    undoOperation: () => AsyncTask<void>;

    /**
     * Registers a custom operation for the given engine.
     */
    registerCustomOperation(engineId: string, operationKey: string, operation: IOperation): void;

    /**
     * Propagates the active history index.
     */
    updateActiveHistoryState(index?: number, enableEditLastAppliedOperation?: boolean): void;

    /**
     * Exports data.
     */
    exportData(
        format: WranglerDataExportFormat
    ): AsyncTask<IWranglerDataExportResultMap[WranglerDataExportFormat] | undefined>;

    /**
     * Exports code.
     */
    exportCode(
        format: WranglerCodeExportFormat,
        options?: IExportCodeOptions
    ): AsyncTask<IWranglerCodeExportResultMap[WranglerCodeExportFormat] | undefined>;

    /**
     * Returns the current orchestrator history list.
     */
    getHistoryList(): IOrchestratorHistoryItem[];

    /**
     * Returns the API of the specified engine or the currently active one if unspecified.
     */
    getEngineApi(engineId?: string): AsyncTask<IEngineApi>;

    /**
     * Reloads the data wrangler state.
     */
    reload(): AsyncTask<void>;

    /**
     * Propagates the active history index.
     */
    updateActiveHistoryState(index?: number): void;

    /**
     * Shows all of the code in the code preview panel.
     */
    previewAllCode(value: boolean): void;
}

/**
 * API for an engine.
 */
export interface IEngineApi {
    engineId: string;
    lineCommentPrefix: string;
    refresh: () => AsyncTask<void>;
    executeCode: CodeExecutor;
    installDependency: (dependency: IDependencyToInstall) => AsyncTask<void>;
    setupInstaller: (outputStream?: CodeOutputStreamListener) => AsyncTask<void>;
    isInstallerAvailable: () => AsyncTask<boolean>;
    installerName: string;
    createWranglingCompletion(
        client: INaturalLanguageClient,
        variableName: string,
        dataFrame: IDataFrame,
        prompt: string
    ): Promise<ICompletionResult>;
}

/**
 * Preset data frame type identifiers.
 */
export enum DataFrameTypeIdentifier {
    Pandas = "pandas",
    PySpark = "pyspark"
}

/**
 * Preset method identifiers for PySpark dataframe conversion.
 */
export enum PySparkDataFrameConversionMethod {
    LimitAndConvert = "LimitAndConvert",
    TakeAndConstruct = "TakeAndConstruct",
    RandomTakeAndConstructByFraction = "RandomTakeAndConstructByFraction",
    RandomLimitAndConvertByFraction = "RandomLimitAndConvertByFraction",
    RandomTakeAndConstructByCount = "RandomTakeAndConstructByCount",
    RandomLimitAndConvertByCount = "RandomLimitAndConvertByCount",
    RDDTakeSampleAndConstruct = "RDDTakeSampleAndConstruct",
    TailAndConstruct = "TailAndConstruct"
}
