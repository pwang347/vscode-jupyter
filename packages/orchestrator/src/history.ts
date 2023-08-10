import { IColumnTarget, IDataFrame, IGridCellEdit, IHistoryItem, IOperationIdentifier } from "@dw/messaging";
import { IBaseProgram, PreviewStrategy } from "./operations/types";

/**
 * Extension of the history item payload to handle localization and dataframe storage.
 */
export interface IOrchestratorHistoryItem extends IHistoryItem {
    getBaseProgram?: () => IBaseProgram;
    getRuntimeCode: (locale: string) => string;
    getDisplayCode: (locale: string) => string;
    getDescription: (locale: string) => string;
    localize: (locale: string) => void;
    getPayload: () => IHistoryItem;
    dataFrame?: IDataFrame;
    previewStrategy?: PreviewStrategy;
    previewDataFrame?: IDataFrame;
}

/**
 * Creates a new history item.
 */
export function createHistoryItem(
    index: number,
    variableName: string,
    code: string,
    description: string,
    targetedColumns: IColumnTarget[],
    gridCellEdits: IGridCellEdit[],
    getBaseProgram: (() => IBaseProgram) | undefined,
    getRuntimeCode: (locale: string) => string,
    getDisplayCode: (locale: string) => string,
    getDescription: (locale: string) => string,
    operation: IOperationIdentifier,
    operationArgs?: any
): IOrchestratorHistoryItem {
    const historyItem = {
        index,
        code,
        description,
        targetedColumns,
        variableName,
        gridCellEdits,
        getBaseProgram,
        getRuntimeCode,
        getDisplayCode,
        getDescription,
        localize: function (locale: string) {
            this.code = getDisplayCode(locale);
            this.description = getDescription(locale);
        },
        getPayload: function () {
            return {
                index: this.index,
                code: this.code,
                description: this.description,
                targetedColumns: this.targetedColumns,
                variableName: this.variableName,
                operation,
                operationArgs,
                gridCellEdits
            };
        },
        operation,
        operationArgs
    };
    return historyItem;
}
