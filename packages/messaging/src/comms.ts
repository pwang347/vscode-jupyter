import { IResolvedPackageDependencyMap } from "./dependencies";
import { IDataFrame } from "./dataframe";
import { IOperationView, ISelection } from "./operations";
import { IHistoryItem } from "./history";
import { IError, ErrorCode } from "./errors";
import { IEngineConstants } from "./engine";
import { IGridCellEdit } from "./operations";
import { IOperationContextMenuItemIdentifier, WranglerContextMenuItem } from "./operationContextMenu";
import { CodeOutputStreamListener } from "./execute";
import { IExportCodeOptions } from "./export";

/**
 * API for orchestrator to communicate with the UI and external code execution modules.
 */
export interface IOrchestratorComms {
    /** API related to the UI. */
    ui: {
        /** Notifies the UI that an error has occurred. */
        raiseError<T extends ErrorCode = ErrorCode>(error: IError<T>): void;

        /** Starts a new session. */
        start(initialDataFrame: IDataFrame): void;

        /** Cleans the UI state to its default state. */
        reset(): void;

        /** Updates the UI with the constants used for this engine. */
        updateConstants(engineConstants: IEngineConstants): void;

        /**
         * Updates the UI with the current met and unmet dependency versions.
         */
        updateDependencies(dependencies: IResolvedPackageDependencyMap): void;

        /** Updates the UI with the supported operation set. */
        updateOperations(operations: IOperationView[], operationContextMenu: WranglerContextMenuItem[]): void;

        /** Updates the UI with the currently active operation. */
        updateActiveOperation(operationKey?: string, args?: any, source?: string, skipPreview?: boolean): void;

        /** Updates the UI with the current history item list. */
        updateHistory(historyItems: IHistoryItem[]): void;

        /** Sets the index of the active history state */
        updateActiveHistoryState(historyState?: { historyItem?: IHistoryItem; dataFrame?: IDataFrame }): void;

        /** Sets the list of grid cell edits */
        updateGridCellEdits(gridCellEdits: IGridCellEdit[]): void;

        /** Sets the active data frame */
        updateDataFrame(dataFrame: IDataFrame): void;

        /** Shows all of the code in the code preview panel. */
        setPreviewAllTheCode(value: boolean): void;
    };

    /** API related to operations. */
    operations: {
        /** Notifies the UI that a preview operation completed. */
        completePreviewOperation(previewDataFrame: IDataFrame): void;

        /** Notifies the UI that a commit operation completed. */
        completeCommitOperation(resultingDataFrame: IDataFrame): void;

        /**
         * Notifies the UI that a reject operation completed. In case an error occurred, there may be no rejected item as
         * the current preview state would be empty.
         */
        completeRejectOperation(resultingDataFrame: IDataFrame, rejectedItem?: IHistoryItem): void;

        /** Notifies the UI that an operation undo completed. */
        completeUndoOperation(resultingDataFrame: IDataFrame, undoneItem: IHistoryItem): void;
    };

    /** API related to code. */
    code: {
        /** Given code, executes it and returns the stdout as a string. */
        execute(
            code: string,
            options?: {
                outputStream?: CodeOutputStreamListener;
            }
        ): Promise<string>;

        /** Interrupts kernel execution */
        interrupt(): Promise<void>;
    };
}

/**
 * API for the UI to communicate with the orchestrator.
 */
export interface IViewComms {
    /** API related to exporting. */
    export: {
        /** Data exporters. */
        data: {
            /**
             * Exports data to a file.
             */
            toFile(format: string): Promise<void>;
        };

        /** Code exporters. */
        code: {
            /**
             * Exports the executed code wrapped as a function.
             */
            toFunctionCode(options?: IExportCodeOptions): Promise<void>;
        };
    };

    /** API related to the clipboard. */
    clipboard: {
        /**
         * Copies the executed code wrapped as a function.
         */
        copyFunctionCode(options?: IExportCodeOptions): Promise<void>;
    };

    /** API related to operations. */
    operations: {
        /** Starts an operation preview. */
        previewOperation(
            operationKey: string,
            args: any,
            activeHistoryIndex?: number,
            skipCodeExecution?: boolean
        ): Promise<void>;

        /** Starts an operation commit. */
        commitOperation(): Promise<void>;

        /** Starts an operation reject. */
        rejectOperation(): Promise<void>;

        /** Removes the latest history item unless it is the only item in the list. */
        undoOperation(): Promise<void>;
    };

    /** API related to the UI. */
    ui: {
        /** Updates the grid selection state. */
        updateSelection(selection: ISelection): void;

        /** Updates the operation state. */
        updateOperation(operationKey?: string, operationArgs?: any): void;

        /** Updates the operation state using a context menu. */
        updateOperationUsingContextMenu(id: IOperationContextMenuItemIdentifier, selection: ISelection): void;

        /** Updates the UI with the current edited cells list. */
        updateEditedCells(editedCells: IGridCellEdit[]): void;

        /** Propagates the index of the active history item */
        updateActiveHistoryIndex(index?: number): void;

        /** Shows all of the code in the code preview panel. */
        setPreviewAllTheCode(value: boolean): void;
    };
}
