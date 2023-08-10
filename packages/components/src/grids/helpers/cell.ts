import {
    ColumnType,
    IDataFrame,
    IDataFrameColumn,
    IDataFrameRow,
    IGridCellEdit,
    IPreviewColumnAnnotation,
    OperationKey
} from "@dw/messaging";

/**
 * Returns true if a cell is editable.
 */
const isCellEditable = (columnAnnotations: IPreviewColumnAnnotation | undefined, rowIndex: number) => {
    return (
        columnAnnotations?.editableCells !== undefined &&
        (columnAnnotations.editableCells === true || columnAnnotations.editableCells.includes(rowIndex))
    );
};

/**
 * Returns true if a cell is a significant input cell.
 */
const isSignificantInputCell = (columnAnnotations: IPreviewColumnAnnotation | undefined, rowIndex: number) => {
    return Boolean(columnAnnotations?.significantCells?.includes(rowIndex));
};

/**
 * Returns whether a cell is a "padding cell" - this happens in the side by side preview type
 * where some cells will be empty when there is a height difference.
 */
const isPaddingCell = (columnAnnotations: IPreviewColumnAnnotation | undefined, rowIndex: number, rowCount: number) => {
    const dataEndIndex = columnAnnotations?.dataEndIndex ?? rowCount - 1;
    return rowIndex > dataEndIndex;
};

/**
 * Returns whether a cell is the last row in its column.
 */
const isLastRow = (columnAnnotations: IPreviewColumnAnnotation | undefined, rowIndex: number, rowCount: number) => {
    const dataEndIndex = columnAnnotations?.dataEndIndex ?? rowCount - 1;
    return rowIndex === dataEndIndex;
};

/**
 * Additional props for grid cells.
 */
export interface ICellProps {
    isEditable: boolean;
    isEdited: boolean;
    isPaddingCell: boolean;
    isLastRow: boolean;
    isSignificantInput: boolean;
    isAutoFilled: boolean;
    hasStagedEdit: boolean;
    displayedDueToError: boolean;
    cellEdit?: IGridCellEdit;
    cellAlignment: CellAlignment;
}

/**
 * Returns false if a dataFrame's executed history item must not be edited
 */
export const isDataFrameEditable = (dataFrame: IDataFrame) => {
    // No custom operation should allow editing cells.
    return dataFrame.error?.executedHistoryItem?.operation.key !== OperationKey.CustomOperation;
};

/**
 * Returns the common cell properties.
 * If you meant to change the editability, you should do it in the editable function in reactDataGrid.tsx
 */
export const getCellProps = (params: {
    dataFrame: IDataFrame;
    dataFrameColumn: IDataFrameColumn;
    dataFrameRow: IDataFrameRow;
    gridRowIndex?: number;
    gridColumnIndex: number;
    gridCellEdits: IGridCellEdit[];
    stagedEdit?: IGridCellEdit;
}): ICellProps => {
    const { dataFrame, dataFrameColumn, dataFrameRow, gridRowIndex, gridColumnIndex, gridCellEdits, stagedEdit } =
        params;
    const colAnnotations = dataFrameColumn.annotations;

    const isEditable =
        gridRowIndex != null && isDataFrameEditable(dataFrame) && isCellEditable(colAnnotations, gridRowIndex);
    const hasStagedEdit = isEditable && stagedEdit?.row === gridRowIndex && stagedEdit.column === gridColumnIndex;

    // find the edit corresponding to the current cell
    let cellEdit: IGridCellEdit | undefined = undefined;
    if (isEditable) {
        cellEdit = hasStagedEdit
            ? stagedEdit
            : gridCellEdits.find((edit) => edit.column === gridColumnIndex && edit.row === gridRowIndex);
    }

    const isEdited = !!cellEdit;
    const isSignificantInput = gridRowIndex != null && isSignificantInputCell(colAnnotations, gridRowIndex);
    const isAutoFilled = !isEdited && isEditable && !!dataFrameRow.data[gridColumnIndex];

    let cellAlignment = CellAlignment.Left;
    if ([ColumnType.Float, ColumnType.Integer].includes(dataFrameColumn.type)) {
        cellAlignment = CellAlignment.Right;
    } else if ([ColumnType.Boolean].includes(dataFrameColumn.type)) {
        cellAlignment = CellAlignment.Center;
    }

    return {
        isEditable,
        isPaddingCell: gridRowIndex != null && isPaddingCell(colAnnotations, gridRowIndex, dataFrame.rowCount),
        isLastRow: gridRowIndex != null && isLastRow(colAnnotations, gridRowIndex, dataFrame.rowCount),
        hasStagedEdit,
        cellEdit,
        isEdited,
        isSignificantInput,
        isAutoFilled,
        displayedDueToError: Boolean(dataFrame.displayedDueToError),
        cellAlignment
    };
};

/**
 * The alignment of the cell value.
 */
export enum CellAlignment {
    Left = "left",
    Center = "center",
    Right = "right"
}
