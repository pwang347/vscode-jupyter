import { IColumnTarget, IGridCellEdit, IOperationIdentifier } from "./operations";

/**
 * Data wrangler history item.
 */
export interface IHistoryItem {
    /** The index of the history item */
    index: number;

    /** The code associated to the operation. */
    code: string;

    /** The description of the operation. */
    description: string;

    /** The columns targeted by the operation. */
    targetedColumns: IColumnTarget[];

    /** The variable name resulting from the executed code. */
    variableName: string;

    /** The operation performed. */
    operation: IOperationIdentifier;

    /** The arguments associated with the operation. Undefined for data import operations. */
    operationArgs?: any;

    /** The grid cell edits associated with the operation. */
    gridCellEdits?: IGridCellEdit[];
}
