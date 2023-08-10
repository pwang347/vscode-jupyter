import * as React from "react";
import type { IDataFrameColumn, IDataFrameRow, IGridCellEdit, IViewComms } from "@dw/messaging";
import type { EditorProps } from "react-data-grid";
import type { ICellRenderers, IEditorRenderers } from "../types";

import { TextEditor } from "./editors/rdgTextEditor";
import { LocalizedStrings } from "../../localization";
import { ReactDataGridCellIcon } from "./rdgCellIcon";
import { CellAlignment, ICellProps } from "../helpers/cell";
import classNames from "classnames";

/**
 * Props for the react-data-grid editor cell.
 */
export interface IReactDataGridEditorCellProps extends EditorProps<IDataFrameRow, unknown> {
    comms: IViewComms;
    dataFrameColumn: IDataFrameColumn;
    gridColumnIndex: number;
    gridRowIndex: number;
    gridCellEdits: IGridCellEdit[];
    disabled: boolean;
    cellProps: ICellProps;
    performGridEdit: (gridEdits: IGridCellEdit[], newEdit?: IGridCellEdit) => void;
    localizedStrings: typeof LocalizedStrings.Grid;
    renderers?: ICellRenderers & IEditorRenderers;
}

/**
 * An editor cell for react-data-grid.
 */
export class ReactDataGridEditorCell extends React.PureComponent<IReactDataGridEditorCellProps> {
    private getEditValue() {
        const { row, dataFrameColumn, cellProps } = this.props;
        const { cellEdit, isAutoFilled, displayedDueToError } = cellProps;

        // default to the data in the data frame
        let editValue = row.data[dataFrameColumn.index];

        // if there is an edit on this cell, display that instead of the original underlying data
        if (cellEdit) {
            editValue = cellEdit.value;

            // if the cell value was autofilled and there's an error, we should hide the value
        } else if (isAutoFilled && displayedDueToError) {
            editValue = "";
        }

        // TODO@DW: enable more editor types
        if (editValue?.toString) {
            editValue = editValue.toString();
        }

        return editValue;
    }

    private commitEdit = (value: any, force?: boolean) => {
        const { gridColumnIndex, gridRowIndex, gridCellEdits, performGridEdit } = this.props;
        const originalValue = this.getEditValue();

        // nothing to commit if the values were the exact same
        if (value === originalValue && !force) {
            return;
        }

        // filter out the existing edits if applicable
        const gridEdits: IGridCellEdit[] = gridCellEdits.filter(
            (edit) => !(edit.row === gridRowIndex && edit.column === gridColumnIndex)
        );

        // if we received an empty string, then we should consider the edit cleared
        // TODO@DW: this might change once we support more editable data types
        if (value === "") {
            performGridEdit(gridEdits);
            return;
        }

        const newEdit: IGridCellEdit = {
            value,
            column: gridColumnIndex,
            row: gridRowIndex
        };
        performGridEdit(gridEdits, newEdit);
    };

    render() {
        const { cellProps, localizedStrings, renderers } = this.props;
        const { isEdited, isSignificantInput, hasStagedEdit, displayedDueToError, cellAlignment } = cellProps;
        const className = classNames({
            "wrangler-grid-cell-editor-content": true,
            "wrangler-grid-right-aligned": cellAlignment === CellAlignment.Right,
            "wrangler-grid-center-aligned": cellAlignment === CellAlignment.Center
        });
        return (
            <div className={className}>
                <ReactDataGridCellIcon
                    isCellEditable={true}
                    isCellEdited={isEdited}
                    isSignificantInputCell={isSignificantInput}
                    isEditStagedForCell={hasStagedEdit}
                    isDisplayedDueToError={displayedDueToError}
                    localizedStrings={localizedStrings}
                    renderers={renderers}
                />
                {this.renderEditor()}
            </div>
        );
    }

    private renderEditor() {
        const { renderers, gridColumnIndex, gridRowIndex, localizedStrings, disabled } = this.props;
        const value = this.getEditValue();
        // TODO@DW: enable more editor types
        return (
            <TextEditor
                disabled={disabled}
                value={value}
                commitEdit={this.commitEdit}
                renderer={renderers?.onRenderTextEditorCell}
                gridColumnIndex={gridColumnIndex}
                gridRowIndex={gridRowIndex}
                localizedStrings={localizedStrings}
            />
        );
    }
}
