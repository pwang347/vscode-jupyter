// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import {
    FailedFilterCode,
    filterColumn,
    formatString,
    IDataFrame,
    IDataFrameColumn,
    ISelection,
    IWranglerContextMenuOperationItem,
    PreviewAnnotationType,
    PreviewStrategy,
    WranglerContextMenuItem
} from "@dw/messaging";
import { renderCustom } from "../../customRender";
import { CellContextMenuGridOperations, Point } from "../types";
import { copyTextToClipboard } from "../helpers/clipboard";
import { IGridSelectionPlugin } from "./gridSelectionPlugin";
import { BaseGridRenderPlugin } from "./baseGridRenderPlugin";
import { IWranglerGridProps } from "../types";
import { GridPluginRenderer } from "./gridPluginRenderer";
import { IGridSortPlugin } from './gridSortPlugin';
import { IGridFilterPlugin } from './gridFilterPlugin';

/**
 * Context menu plugin.
 */
export interface IGridContextMenuPlugin {
    dismissAll: () => void;
    showHeaderContextMenu: (target: Element | Point, targetCol: number) => void;
    showCellContextMenu: (target: Element | Point, targetRow: number, targetCol: number) => void;
}

/**
 * Renderer for grid context menus including header and cell context menus.
 */
export class GridContextMenuPlugin<TCol>
    extends BaseGridRenderPlugin<TCol, {}, IWranglerGridProps>
    implements IGridContextMenuPlugin
{
    id = "context-menu";

    private headerContextMenuTarget?: Element | Point;
    private cellContextMenuTarget?: Element | Point;
    private contextMenuTargetRow?: number;
    private contextMenuTargetCol?: number;

    constructor(
        getColumnDefinitions: () => TCol[],
        setColumnDefinitions: (columnDefinitions: TCol[]) => void,
        renderer: React.RefObject<GridPluginRenderer>,
        private onChangeHeaderContextMenuVisibility: (visible: boolean) => void,
        private gridSelectionPlugin?: IGridSelectionPlugin,
        private gridSortPlugin?: IGridSortPlugin,
        private gridFilterPlugin?: IGridFilterPlugin
    ) {
        super(getColumnDefinitions, setColumnDefinitions, renderer);
        this.gridSelectionPlugin?.onSelectionChanged(() => {
            this.dismissAll();
        });
    }

    render(props: IWranglerGridProps, selection: ISelection, activeDataFrame: IDataFrame | undefined) {
        return (
            <div>
                {this.renderHeaderContextMenu(props, selection, activeDataFrame)}
                {this.renderCellContextMenu(props, selection, activeDataFrame)}
            </div>
        );
    }

    /**
     * Dismisses all context menus.
     */
    public dismissAll() {
        this.setHeaderContextMenuTarget(undefined);
        this.cellContextMenuTarget = undefined;
        this.contextMenuTargetCol = undefined;
        this.contextMenuTargetRow = undefined;

        // TODO@DW: we should make these re-renders granular to the current plugin only
        this.renderer.current?.forceUpdate();
    }

    /**
     * Displays a header context menu at the target element with the target column index.
     */
    public showHeaderContextMenu(target: Element | Point, targetCol: number) {
        this.setHeaderContextMenuTarget(target);
        this.cellContextMenuTarget = undefined;
        this.contextMenuTargetCol = targetCol;
        this.contextMenuTargetRow = undefined;

        // TODO@DW: we should make these re-renders granular to the current plugin only
        this.renderer.current?.forceUpdate();
    }

    /**
     * Displays a cell context menu at the target element with the target row and column indices.
     */
    public showCellContextMenu(target: Element | Point, targetRow: number, targetCol: number) {
        this.setHeaderContextMenuTarget(undefined);
        this.cellContextMenuTarget = target;
        this.contextMenuTargetCol = targetCol;
        this.contextMenuTargetRow = targetRow;

        // TODO@DW: we should make these re-renders granular to the current plugin only
        this.renderer.current?.forceUpdate();
    }

    /**
     * Returns a string denoting the reason why a context menu item is disabled or undefined
     * otherwise if it shouldn't be disabled.
     */
    private getDisabledReason(
        props: IWranglerGridProps,
        syntheticSelection: ISelection,
        operationMenuItem: IWranglerContextMenuOperationItem,
        activeDataFrame: IDataFrame | undefined
    ) {
        const { operations, localizedStrings } = props;
        if (!activeDataFrame) {
            return;
        }
        const columns = syntheticSelection.columns.map((col) => activeDataFrame.columns[col.index]);
        const incrementalSelection: IDataFrameColumn[] = [];
        const operation = operations.find((operation) => operation.key === operationMenuItem.operation.key);
        if (!operation) {
            return;
        }
        const targetFilter = operationMenuItem.targetFilter;
        for (const column of columns) {
            // use an incremental selection to simulate selecting one column at a time
            // this is helpful for example in cases where we want to check whether all selected
            // types are the same and we can abort the moment we see two that mismatch
            const result = filterColumn(column, incrementalSelection, targetFilter);
            switch (result) {
                case FailedFilterCode.SingleColumnOnly:
                    return localizedStrings.TargetDisabledSingleColumnOnly;
                case FailedFilterCode.MixedColumn:
                    return localizedStrings.TargetDisabledMixedColumn;
                case FailedFilterCode.UnknownType:
                    return formatString(localizedStrings.TargetDisabledUnknownType, column.rawType);
                case FailedFilterCode.RawTypeMismatch:
                case FailedFilterCode.TypeMismatch:
                    return formatString(localizedStrings.TargetDisabledTypeMismatch, column.rawType);
                case FailedFilterCode.TypesNotSame:
                    return localizedStrings.TargetDisabledTypesNotSame;
                default:
                    incrementalSelection.push(column);
            }
        }
        return;
    }

    /**
     * Recursively adds a key property to the menu items and optionally allows the host
     * to customize the menu item properties during this traversal.
     */
    private getMenuItemsRecursive(
        props: IWranglerGridProps,
        syntheticSelection: ISelection,
        menuItems: WranglerContextMenuItem[],
        activeDataFrame: IDataFrame | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any[] {
        const { renderers, comms } = props;
        return menuItems.map((menuItem, idx) => {
            let key;
            let onClick;
            let disabledReason;
            if (menuItem.itemType === "operation") {
                key = `${menuItem.operation.menuId}_${menuItem.operation.key}_${idx}`;
                onClick = () => {
                    comms.ui.updateOperationUsingContextMenu(
                        {
                            operationKey: menuItem.operation.key,
                            menuId: menuItem.operation.menuId
                        },
                        syntheticSelection
                    );
                };
                disabledReason = this.getDisabledReason(props, syntheticSelection, menuItem, activeDataFrame);
            } else if (menuItem.itemType === "divider") {
                key = `divider${idx}`;
            } else {
                key = `subMenu${idx}`;
            }
            return renderCustom({
                props: {
                    key,
                    menuItem,
                    onClick,
                    disabledReason,
                    renderSubMenu: (subMenu) => {
                        return this.getMenuItemsRecursive(props, syntheticSelection, subMenu, activeDataFrame);
                    }
                },
                defaultRender: () => null,
                customRender: renderers?.onRenderOperationContextMenuItem
            });
        });
    }

    /**
     * Sets the header menu target and also notifies listeners that the menu has been shown / hidden.
     */
    private setHeaderContextMenuTarget = (target: Element | Point | undefined) => {
        this.headerContextMenuTarget = target;
        this.onChangeHeaderContextMenuVisibility(!!target);
    };

    /**
     * Renderer for header context menus.
     */
    public renderHeaderContextMenu(
        props: IWranglerGridProps,
        selection: ISelection,
        activeDataFrame: IDataFrame | undefined
    ) {
        console.log("@@RENDER1");
        const { renderers, disabled, disableInteractions, operationContextMenu } = props;

        // nothing to do if we don't have a target or are missing information to render the header context menu
        if (
            !this.headerContextMenuTarget ||
            this.contextMenuTargetCol === undefined ||
            !activeDataFrame?.columns[this.contextMenuTargetCol] ||
            // in general for the None strategy we aren't sure of what the new data is, so unless nothing was changed
            // we shouldn't allow context menu
            (!activeDataFrame.isPreviewUnchanged && activeDataFrame.previewStrategy === PreviewStrategy.None)
        ) {
            console.log("@@@?1");
            return;
        }

        if (disabled || disableInteractions) {
            this.setHeaderContextMenuTarget(undefined);
            console.log("@@@?2");
            return;
        }

        // compute the selection state that should be used when considering legal operations
        const syntheticSelection: ISelection = {
            columns: [...selection.columns],
            isEntireTableSelected: false,
            rows: []
        };
        if (!syntheticSelection.columns.find((c) => c.index === this.contextMenuTargetCol)) {
            if (syntheticSelection.columns.length > 1) {
                syntheticSelection.columns.push({
                    index: this.contextMenuTargetCol,
                    name: activeDataFrame.columns[this.contextMenuTargetCol].name,
                    key: activeDataFrame.columns[this.contextMenuTargetCol].key
                });
            } else {
                syntheticSelection.columns = [
                    {
                        index: this.contextMenuTargetCol,
                        name: activeDataFrame.columns[this.contextMenuTargetCol].name,
                        key: activeDataFrame.columns[this.contextMenuTargetCol].key
                    }
                ];
            }
        }

        // remove the preview and index columns from the selection, if there's nothing left then don't render anything
        syntheticSelection.columns = syntheticSelection.columns.filter((col) => {
            return (
                activeDataFrame.columns[col.index].annotations?.annotationType !== PreviewAnnotationType.Added &&
                col.index !== 0
            );
        });
        if (syntheticSelection.columns.length === 0) {
            return;
        }

        console.log("@@@WE RENDERIN ", this.getMenuItemsRecursive(
            props,
            syntheticSelection,
            operationContextMenu,
            activeDataFrame
        ));
        const headerContextMenu = renderCustom({
            props: {
                selection: syntheticSelection,
                target: this.headerContextMenuTarget,
                dismiss: () => {
                    this.setHeaderContextMenuTarget(undefined);
                    // TODO@DW: we should make these re-renders granular to the current plugin only
                    this.renderer.current?.forceUpdate();
                },
                columnIndex: this.contextMenuTargetCol,
                operationContextMenuItems: this.getMenuItemsRecursive(
                    props,
                    syntheticSelection,
                    operationContextMenu,
                    activeDataFrame
                ),
                gridOperations: [
                    ...((this.gridSortPlugin?.getSortColumn()?.index === this.contextMenuTargetCol && this.contextMenuTargetCol) || (!!this.gridFilterPlugin?.getColumnFilter(this.contextMenuTargetCol))  ? [{
                        type: "button",
                        key: "clear",
                        label: "Clear all",
                        onClick: () => {
                            this.gridSortPlugin?.clearSortColumn();
                            this.gridFilterPlugin?.clearFilter(this.contextMenuTargetCol!)
                        }
                    },
                    {
                        type: "divider"
                    },
                ] : []) as any,
                    {
                        type: "button",
                        key: "sortAsc",
                        label: "Sort Ascending",
                        onClick: () => {
                            this.gridSortPlugin?.sortColumn(this.contextMenuTargetCol!, true)
                        }
                    },
                    {
                        type: "button",
                        key: "sortDesc",
                        label: "Sort Descending",
                        onClick: () => {
                            this.gridSortPlugin?.sortColumn(this.contextMenuTargetCol!, false)
                        }
                    },
                    {
                        type: "divider"
                    },
                    {
                        type: "textField",
                        key: "filter",
                        label: "filter",
                        filter: this.gridFilterPlugin?.getColumnFilter(this.contextMenuTargetCol!) ?? "",
                        onFilterChange: (filter) => { this.gridFilterPlugin?.filterColumn(this.contextMenuTargetCol!, filter)}
                    }
                ]
            },
            defaultRender: () => null,
            customRender: renderers?.onRenderHeaderContextMenu
        });
        return headerContextMenu;
    }

    private renderCellContextMenu(
        props: IWranglerGridProps,
        selection: ISelection,
        activeDataFrame: IDataFrame | undefined
    ) {
        const { renderers, localizedStrings, disabled } = props;
        const rows = activeDataFrame?.getLoadedRows();
        if (
            !this.cellContextMenuTarget ||
            this.contextMenuTargetCol === undefined ||
            this.contextMenuTargetRow === undefined ||
            !activeDataFrame ||
            !rows ||
            !rows[this.contextMenuTargetRow]
        ) {
            return;
        }
        const row = rows[this.contextMenuTargetRow];

        if (disabled) {
            this.cellContextMenuTarget = undefined;
            return;
        }

        let syntheticSelection = { ...selection, columns: [] };
        // we need to reset if we're already in a preview
        if (activeDataFrame.isPreview) {
            syntheticSelection = { rows: [], columns: [], isEntireTableSelected: false };
        }
        if (syntheticSelection.rows.find((r) => r.gridIndex === this.contextMenuTargetRow) == undefined) {
            if (syntheticSelection.rows.length > 1) {
                syntheticSelection.rows.push({
                    gridIndex: this.contextMenuTargetRow,
                    dataframeIndex: row.data[0]
                });
            } else {
                syntheticSelection.rows = [
                    {
                        gridIndex: this.contextMenuTargetRow,
                        dataframeIndex: row.data[0]
                    }
                ];
            }
        }
        const dismiss = () => {
            this.cellContextMenuTarget = undefined;
            // TODO@DW: we should make these re-renders granular to the current plugin only
            this.renderer.current?.forceUpdate();
        };
        const cellContextMenu = renderCustom({
            props: {
                target: this.cellContextMenuTarget,
                dismiss,
                rowIndex: this.contextMenuTargetRow,
                columnIndex: this.contextMenuTargetCol,
                gridOperations: [
                    ...(selection.rows.length > 1
                        ? []
                        : [
                              {
                                  key: CellContextMenuGridOperations.CopyCell,
                                  label: localizedStrings.CellContextMenuGridOperationCopy,
                                  onClick: async () => {
                                      const rows = activeDataFrame?.getLoadedRows();
                                      if (
                                          activeDataFrame &&
                                          this.contextMenuTargetCol !== undefined &&
                                          this.contextMenuTargetRow !== undefined &&
                                          rows &&
                                          rows[this.contextMenuTargetRow]
                                      ) {
                                          const columnIndex = activeDataFrame.columns[this.contextMenuTargetCol].index;
                                          if (columnIndex !== undefined) {
                                              const value = rows[this.contextMenuTargetRow].data[columnIndex];

                                              // TODO@DW: we should consolidate our data formatting, currently I think some of this
                                              // is happening at the pandas level and we need to rectify that
                                              await copyTextToClipboard(value != undefined ? value.toString() : "");
                                          }
                                      }
                                  }
                              }
                          ]),
                    {
                        key: CellContextMenuGridOperations.CopyRows,
                        label:
                            selection.rows.length > 1
                                ? localizedStrings.CellContextMenuGridOperationCopyRows
                                : localizedStrings.CellContextMenuGridOperationCopyRow,
                        onClick: async () => {
                            const rowSelection = new Set(selection.rows.map((row) => row.gridIndex));
                            const rows = activeDataFrame?.getLoadedRows().filter((row) => rowSelection.has(row.index));
                            if (activeDataFrame && rows) {
                                // TODO@DW: we should consolidate our data formatting, currently I think some of this
                                // is happening at the pandas level and we need to rectify that
                                const value = rows
                                    .map((row) =>
                                        row.data.map((value) => (value != undefined ? value.toString() : "")).join("\t")
                                    )
                                    .join("\n");

                                await copyTextToClipboard(value);
                            }
                        }
                    }
                ]
            },
            defaultRender: () => null,
            customRender: renderers?.onRenderCellContextMenu
        });
        return cellContextMenu;
    }
}
