// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import classNames from "classnames";
import type { FormatterProps } from "react-data-grid";
import { IDataFrameRow, IDataFrameColumn } from "@dw/messaging";
import { IGridContextMenuPlugin } from "../plugins/gridContextMenuPlugin";
import { IGridSelectionPlugin } from "../plugins/gridSelectionPlugin";
import { LocalizedStrings } from "../../localization";
import { ICellRenderers } from "../types";
import { ReactDataGridCellIcon } from "./rdgCellIcon";
import { CellAlignment, ICellProps } from "../helpers/cell";
import { renderCustom } from "../../customRender";

/**
 * Props for the react-data-grid view cell.
 */
export interface IReactDataGridViewCellProps extends FormatterProps<IDataFrameRow, unknown> {
    dataFrameColumn: IDataFrameColumn;
    dataFrameIndexColumnName: string;
    gridColumnIndex: number;
    gridRowIndex: number;
    rootRef: React.RefObject<HTMLDivElement>;
    tabIndex: number;
    cellProps: ICellProps;
    onCellContextMenuShown?: () => void;
    gridContextMenuPlugin: IGridContextMenuPlugin;
    gridSelectionPlugin: IGridSelectionPlugin;
    localizedStrings: typeof LocalizedStrings.Grid;
    renderers?: ICellRenderers;
}

/**
 * A view cell for react-data-grid.
 */
export class ReactDataGridViewCell extends React.PureComponent<IReactDataGridViewCellProps> {
    private getDisplayValue() {
        const {
            row,
            dataFrameColumn,
            gridSelectionPlugin,
            gridRowIndex,
            gridColumnIndex,
            localizedStrings,
            cellProps
        } = this.props;
        const { cellEdit, isAutoFilled, isEditable, isPaddingCell, displayedDueToError } = cellProps;

        // A loading placeholder row will have a negative index.
        const isLoadingCell = row.index < 0;

        if (isLoadingCell) {
            return renderCustom({
                props: {
                    column: dataFrameColumn
                },
                defaultRender: () => null,
                customRender: this.props.renderers?.onRenderLoadingCell
            });
        }

        // default to the data in the data frame
        let displayedValue = row.data[dataFrameColumn.index];

        // if there is an edit on this cell, display that instead of the original underlying data
        if (cellEdit) {
            displayedValue = cellEdit.value;

            // if the cell value was autofilled and there's an error, we should hide the value
        } else if (isAutoFilled && displayedDueToError) {
            displayedValue = "";
        }

        // if the cell is editable, selected and empty then we should set the text to the placeholder
        if (isEditable && gridSelectionPlugin.isCellSelected(gridRowIndex, gridColumnIndex) && displayedValue === "") {
            displayedValue = localizedStrings.CellEditPlaceholder;
        }

        // if we have a missing value, display a string instead
        // note: we need to call `toString` for some types like `true` which doesn't get rendered
        displayedValue = displayedValue === null ? localizedStrings.CellMissingValue : displayedValue.toString();

        if (isPaddingCell) {
            displayedValue = "";
        }

        return displayedValue;
    }

    render() {
        const {
            dataFrameColumn,
            gridColumnIndex,
            gridRowIndex,
            row,
            cellProps,
            rootRef,
            tabIndex,
            gridContextMenuPlugin,
            gridSelectionPlugin,
            onCellContextMenuShown,
            localizedStrings,
            renderers
        } = this.props;
        const {
            isPaddingCell,
            isEditable,
            isEdited,
            isSignificantInput,
            hasStagedEdit,
            displayedDueToError,
            cellAlignment
        } = cellProps;
        const displayedValue = this.getDisplayValue();
        const isValueMissing = displayedValue === null;

        // A loading placeholder row will have a negative index.
        const isLoadingCell = row.index < 0;

        const className = classNames({
            "wrangler-grid-cell-view-content": true,
            "wrangler-na-value": isValueMissing,
            "wrangler-grid-right-aligned": cellAlignment === CellAlignment.Right,
            "wrangler-grid-center-aligned": cellAlignment === CellAlignment.Center,
            "wrangler-grid-cell-loading": isLoadingCell
        });

        return (
            <div
                title={row.data[dataFrameColumn.index]}
                className={className}
                ref={rootRef}
                tabIndex={tabIndex}
                onKeyDown={this.handleKeyDown}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // make sure we don't update the selection state when we right click
                    if (isPaddingCell || isLoadingCell) {
                        return;
                    }
                    onCellContextMenuShown?.();
                    gridContextMenuPlugin.showCellContextMenu(
                        { left: e.clientX, top: e.clientY },
                        gridRowIndex,
                        gridColumnIndex
                    );
                }}
                onClick={(e) => {
                    if (isPaddingCell || isLoadingCell) {
                        return;
                    }
                    gridSelectionPlugin.selectCell(gridRowIndex, gridColumnIndex, e as any);
                }}
            >
                {!isLoadingCell && (
                    <ReactDataGridCellIcon
                        isCellEditable={isEditable}
                        isCellEdited={isEdited}
                        isSignificantInputCell={isSignificantInput}
                        isEditStagedForCell={hasStagedEdit}
                        isDisplayedDueToError={displayedDueToError}
                        localizedStrings={localizedStrings}
                        renderers={renderers}
                    />
                )}
                {displayedValue}
            </div>
        );
    }

    private handleKeyDown = (ev: React.KeyboardEvent) => {
        // Don't let RDG handle tab events. It will move focus through the entire grid,
        // which makes it difficult for keyboard users to navigate beyond the grid.
        if (ev.key === "Tab") {
            ev.stopPropagation();
        }
    };
}
