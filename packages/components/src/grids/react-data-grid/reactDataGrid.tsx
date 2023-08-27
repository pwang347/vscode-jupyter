// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import memoize from "memoize-one";

import {
    IDataFrameRow,
    IGridCellEdit,
    ColumnType,
    PreviewAnnotationType,
    isPreviewingUpdatesToLastAppliedOperation,
    isEditingLastAppliedOperation,
    MinimumRowChunkSize,
    deepEqual
} from "@dw/messaging";
import DataGrid, { DataGridHandle, Column, Row, RowRendererProps, useFocusRef } from "react-data-grid";
import { ISelection, IDataFrame } from "@dw/messaging";
import { GridSelectionPlugin } from "../plugins/gridSelectionPlugin";
import { measureText } from "../helpers";
import { IWranglerGridProps } from "../types";
import { GridContextMenuPlugin } from "../plugins/gridContextMenuPlugin";
import { IGridPlugin } from "../plugins/types";
import { ReactDataGridEditorCell } from "./rdgEditorCell";
import { ReactDataGridViewCell } from "./rdgViewCell";
import { ReactDataGridHeaderCell } from "./rdgHeaderCell";
import { GridPluginRenderer } from "../plugins/gridPluginRenderer";
import { QuickInsights } from "./quickInsights";
import classNames from "classnames";
import debounce from "lodash.debounce";

import "./reactDataGrid.scss";
import { getCellProps, isDataFrameEditable } from "../helpers/cell";
import { GridSortPlugin } from '../plugins/gridSortPlugin';
import { GridFilterPlugin } from '../plugins/gridFilterPlugin';
import { getColumnScrollLeft, waitForScrollEnd } from "../helpers/scroll";

/**
 * Column definition for react-data-grid.
 */
interface IReactDataGridColumn extends Column<IDataFrameRow> {
    index: number;
    columnKey: string;
}

/**
 * Props for a react data grid.
 */
interface IReactDataGridProps extends IWranglerGridProps {
    // To prevent RDG from virtualizing the rendered cells. For tests only.
    disableVirtualization?: boolean;
    style?: React.CSSProperties;
}

/**
 * State for a react data grid.
 */
interface IReactDataGridState {
    activeDataFrame?: IDataFrame;
    columnDefinitions: IReactDataGridColumn[];
    rowData: IDataFrameRow[];
    selection: ISelection;
}

// the height of a row (including headers)
// note: if you modify this please do a scan of the scss files to make sure none of the height
// values are broken, e.g. for column header buttons
const rowHeight = 22;

// this is the internal min-width for rdg
const minimumColumnWidth = 200;

// this is the internal min-width for rdg on the index column.
const minimumIndexColumnWidth = 80;

// we need to pad the column widths (determined by just measuring string length) so that they fill the rdg column space
const columnWidthCorrectionAmount = 48;

// extra padding when a column is a newly previewed column
const previewColumnWidthCorrectionAmount = 32;

// How many additional rows to load at a time when scrolling.
// This is also the minimum number of rows we initially load.
const rowChunkSize = MinimumRowChunkSize;

// debounce time between grid rerenders
const rerenderGridDebounceTime = 50;

// Number of "loading rows" to render at the bottom of the grid.
// These provide some feedback to indicate there is more data to load.
const numLoadingRows = 5;

/**
 * Wrangler grid implementation using react-data-grid.
 */
export class ReactDataGrid extends React.PureComponent<IReactDataGridProps, IReactDataGridState> {
    private gridSortPlugin: GridSortPlugin<IReactDataGridColumn>;
    private gridFilterPlugin: GridFilterPlugin<IReactDataGridColumn>;
    private gridSelectionPlugin: GridSelectionPlugin<IReactDataGridColumn>;
    private gridContextMenuPlugin: GridContextMenuPlugin<IReactDataGridColumn>;
    private plugins: IGridPlugin<IReactDataGridColumn>[] = [];
    private pluginRenderer = React.createRef<GridPluginRenderer>();
    private grid = React.createRef<DataGridHandle>();
    private stagedEdit?: IGridCellEdit;
    private activeGridCell?: { row: number; col: number };
    private editInFlight: boolean = false;
    private columnWidths: number[] = [];

    public state: IReactDataGridState = {
        columnDefinitions: [],
        rowData: [],
        selection: { columns: [], rows: [], isEntireTableSelected: false }
    };

    constructor(props: IReactDataGridProps) {
        super(props);
        this.gridSortPlugin = new GridSortPlugin(this.getColumnDefinitions, this.setColumnDefinitions, this.pluginRenderer);
        this.gridFilterPlugin = new GridFilterPlugin(this.getColumnDefinitions, this.setColumnDefinitions, this.pluginRenderer);
        this.gridSelectionPlugin = new GridSelectionPlugin(this.getColumnDefinitions, this.setColumnDefinitions);
        this.gridContextMenuPlugin = new GridContextMenuPlugin(
            this.getColumnDefinitions,
            this.setColumnDefinitions,
            this.pluginRenderer,
            this.onChangeHeaderContextMenuVisibility,
            this.gridSelectionPlugin,
            this.gridSortPlugin,
            this.gridFilterPlugin
        );
        this.plugins = [this.gridSelectionPlugin, this.gridContextMenuPlugin];

        // handle selection changes
        this.gridSelectionPlugin.onSelectionChanged((oldSelection, newSelection, isSynthetic, isMouseEvent) => {
            const df = this.state.activeDataFrame;
            if (!df) {
                return;
            }
            const rows = this.state.rowData;
            const selection: ISelection = {
                isEntireTableSelected: newSelection.isEntireTableSelected,
                rows: newSelection.rows.map((r) => ({
                    gridIndex: r,
                    dataframeIndex: rows[r].data[0]
                })),
                columns: newSelection.columns.map((c) => ({
                    name: this.state.columnDefinitions[c].name as string,
                    key: this.state.columnDefinitions[c].columnKey,
                    index: c
                })),
                activeCell: newSelection.activeCell
                    ? {
                          row: {
                              gridIndex: newSelection.activeCell.row,
                              dataframeIndex: rows[newSelection.activeCell.row]?.data[0]
                          },
                          column: {
                              name: this.state.columnDefinitions[newSelection.activeCell.column].name as string,
                              key: this.state.columnDefinitions[newSelection.activeCell.column].columnKey,
                              index: newSelection.activeCell.column
                          }
                      }
                    : undefined
            };

            const oldActiveGridCell = this.activeGridCell;
            this.activeGridCell = newSelection.activeCell
                ? {
                      col: newSelection.activeCell.column,
                      row: newSelection.activeCell.row
                  }
                : undefined;

            if (!this.activeGridCell) {
                if (newSelection.columns.length > 0) {
                    this.activeGridCell = {
                        col: newSelection.columns[newSelection.columns.length - 1],
                        row: -1
                    };
                } else if (newSelection.rows.length > 0) {
                    this.activeGridCell = {
                        col: oldActiveGridCell?.col ?? 0,
                        row: newSelection.rows[newSelection.rows.length - 1] ?? oldActiveGridCell?.row ?? 0
                    };
                } else {
                    this.activeGridCell = oldActiveGridCell;
                }
            }

            // compute the columns and rows that changed with the new selection
            const colIndexSet = this.gridSelectionPlugin.getColumnSelectionDifference(oldSelection, newSelection);
            const rowIndexSet = this.gridSelectionPlugin.getRowSelectionDifference(oldSelection, newSelection);

            // make sure we always update the previously selected row
            if (rowIndexSet.size === 0 && colIndexSet.size === 0 && oldActiveGridCell) {
                rowIndexSet.add(oldActiveGridCell.row);
            }

            // keep the grid in sync with our known selection state
            // Note that this must happen before any `setState` calls, otherwise when we render the grid the old selection will be restored.
            this.grid.current?.selectCell({
                rowIdx: this.activeGridCell?.row ?? -1,
                idx: this.activeGridCell?.col ?? -1
            });
            this.setState({ selection });

            if (colIndexSet.size > 0 || newSelection.isEntireTableSelected !== oldSelection.isEntireTableSelected) {
                if (isSynthetic || isMouseEvent) {
                    this.rerenderGrid();
                } else {
                    this.rerenderGridDebounced();
                }
            }

            // no need to update the rest of the UI again if this was triggered from something outside of the grid (e.g. operation panel)
            if (!isSynthetic) {
                props.comms.ui.updateSelection(selection);
            }
        });
    }

    static getDerivedStateFromProps(props: IReactDataGridProps): Partial<IReactDataGridState> | null {
        const lastAppliedOperationHasUpdates = isPreviewingUpdatesToLastAppliedOperation({
            dataFrameHeader: props.dataFrame,
            historyItemsLength: props.historyItems.length,
            enableEditLastAppliedOperation: props.enableEditLastAppliedOperation
        });
        if (props.activeHistoryDataFrame && !lastAppliedOperationHasUpdates) {
            return {
                activeDataFrame: props.activeHistoryDataFrame
            };
        }
        return {
            activeDataFrame: props.dataFrame
        };
    }

    private onChangeHeaderContextMenuVisibility = (isVisible: boolean) => {
        this.grid.current?.element?.classList.toggle("wrangler-grid-header-context-menu-visible", isVisible);
    };

    private generateColumns(df: IDataFrame): IReactDataGridColumn[] {
        const {
            comms,
            gridCellEdits,
            renderers,
            localizedStrings,
            headerFont,
            activeHistoryDataFrame,
            dataFrame,
            historyItems,
            enableEditLastAppliedOperation
        } = this.props;
        const { activeDataFrame } = this.state;
        if (!activeDataFrame) {
            return [];
        }

        const isEditingLastOperation = isEditingLastAppliedOperation({
            activeHistoryIndex: activeHistoryDataFrame?.historyItem.index,
            historyItemsLength: historyItems.length,
            enableEditLastAppliedOperation
        });

        const lastAppliedOperationHasUpdates = isPreviewingUpdatesToLastAppliedOperation({
            dataFrameHeader: dataFrame,
            historyItemsLength: historyItems.length,
            enableEditLastAppliedOperation
        });

        this.columnWidths = [];
        return df.columns.map((c) => {
            const nameWidth = measureText(
                c.name,
                headerFont ?? {
                    name: "Segoe WPC",
                    sizeInPx: 14,
                    weight: 600
                }
            );
            const annotationType = c.annotations?.annotationType;
            // it's a bit jarring to add padding to an existing column, so we can just add the extra
            // padding for readability only when it's an added column
            const addPreviewColumnPadding = annotationType === PreviewAnnotationType.Added;
            const nameWidthWithCorrections =
                nameWidth +
                columnWidthCorrectionAmount +
                (addPreviewColumnPadding ? previewColumnWidthCorrectionAmount : 0);
            const width =
                c.index === 0
                    ? minimumIndexColumnWidth
                    : // use the min width wherever possible, otherwise try to use length based on the column name
                    nameWidthWithCorrections > minimumColumnWidth
                    ? nameWidthWithCorrections
                    : minimumColumnWidth;

            this.columnWidths.push(width);
            const columnDefinition: IReactDataGridColumn = {
                index: c.index,
                key: String(c.index),
                name: c.name,
                columnKey: c.key,
                resizable: true,
                width,
                // styling for grid cells (edit + view mode)
                // note: header cells don't support a function interface, so we'll have to apply the CSS for it
                // inside of a custom-rendered div
                cellClass: (row) => {
                    const cellProps = getCellProps({
                        dataFrame: activeDataFrame,
                        dataFrameColumn: c,
                        dataFrameRow: row,
                        gridRowIndex: row.index,
                        gridColumnIndex: c.index,
                        gridCellEdits,
                        stagedEdit: this.stagedEdit
                    });
                    const {
                        isPaddingCell,
                        isLastRow,
                        isEdited,
                        displayedDueToError,
                        hasStagedEdit,
                        isSignificantInput,
                        isAutoFilled
                    } = cellProps;

                    // whether this is an empty padding cell
                    if (isPaddingCell) {
                        return classNames({
                            "wrangler-grid-cell": true
                        });
                    }

                    return classNames({
                        "wrangler-grid-cell": true,
                        "wrangler-grid-cell-last-row": isLastRow,
                        "wrangler-grid-cell-edited-success": isEdited && !displayedDueToError,
                        "wrangler-grid-cell-edited-failure": hasStagedEdit && displayedDueToError,
                        "wrangler-grid-cell-significant-input": isSignificantInput,
                        "wrangler-grid-cell-auto-filled": isAutoFilled,
                        "wrangler-left-aligned": c && (c.type === ColumnType.String || c.type === ColumnType.Category),
                        "wrangler-grid-column-added": c.annotations?.annotationType === PreviewAnnotationType.Added,
                        "wrangler-grid-column-removed": c.annotations?.annotationType === PreviewAnnotationType.Removed,
                        "wrangler-grid-column-targeted": !!c.annotations?.isTargeted,
                        "wrangler-grid-row-added": row.annotations?.annotationType === PreviewAnnotationType.Added,
                        "wrangler-grid-row-removed": row.annotations?.annotationType === PreviewAnnotationType.Removed,
                        "wrangler-grid-row-targeted": !!row.annotations?.isTargeted,
                        "wrangler-grid-column-selected": this.gridSelectionPlugin.isColumnSelected(c.index),
                        "wrangler-grid-cell-modified": row.annotations?.modifiedColumns?.includes(c.index)
                    });
                },
                editable: (row) => {
                    if (!isDataFrameEditable(activeDataFrame)) {
                        return false;
                    }
                    const editableCells = c.annotations?.editableCells;
                    return !this.editInFlight && !!(editableCells === true || editableCells?.includes(row.index));
                },
                editor: (props) => {
                    const cellProps = getCellProps({
                        dataFrame: activeDataFrame,
                        dataFrameColumn: c,
                        dataFrameRow: props.row,
                        gridRowIndex: props.row.index,
                        gridColumnIndex: c.index,
                        gridCellEdits,
                        stagedEdit: this.stagedEdit
                    });
                    return (
                        props.row.index >= 0 && (
                            <ReactDataGridEditorCell
                                {...props}
                                comms={comms}
                                // Index column isn't editable, so we can safely cast this
                                dataFrameColumn={c}
                                gridColumnIndex={c.index}
                                gridRowIndex={props.row.index}
                                gridCellEdits={this.stagedEdit ? [...gridCellEdits, this.stagedEdit] : gridCellEdits}
                                disabled={!!this.props.disabled}
                                cellProps={cellProps}
                                performGridEdit={this.performGridEdit}
                                localizedStrings={localizedStrings}
                                renderers={renderers}
                            />
                        )
                    );
                },
                formatter: (props) => {
                    const { ref, tabIndex } = useFocusRef(props.isCellSelected);
                    const cellProps = getCellProps({
                        dataFrame: activeDataFrame,
                        dataFrameColumn: c,
                        dataFrameRow: props.row,
                        gridRowIndex: props.row.index,
                        gridColumnIndex: c.index,
                        gridCellEdits,
                        stagedEdit: this.stagedEdit
                    });
                    return (
                        <ReactDataGridViewCell
                            {...props}
                            dataFrameColumn={c}
                            gridColumnIndex={c.index}
                            gridRowIndex={props.row.index}
                            dataFrameIndexColumnName={activeDataFrame.indexColumnKey}
                            gridContextMenuPlugin={this.gridContextMenuPlugin}
                            gridSelectionPlugin={this.gridSelectionPlugin}
                            rootRef={ref as any}
                            tabIndex={tabIndex}
                            cellProps={cellProps}
                            onCellContextMenuShown={this.props.onCellContextMenuShown}
                            localizedStrings={localizedStrings}
                            renderers={renderers}
                        />
                    );
                },
                headerCellClass: classNames({
                    "column-added": c.annotations?.annotationType === PreviewAnnotationType.Added,
                    "column-removed": c.annotations?.annotationType === PreviewAnnotationType.Removed
                }),
                headerRenderer: (props) => {
                    const { ref, tabIndex } = useFocusRef(props.isCellSelected);
                    // handle keyboard navigation
                    if (
                        props.isCellSelected &&
                        (this.activeGridCell?.col !== props.column.idx || this.activeGridCell?.row !== -1)
                    ) {
                        this.gridSelectionPlugin.selectColumn(props.column.idx);
                    }
                    return (
                        <ReactDataGridHeaderCell
                            {...props}
                            comms={comms}
                            telemetryLogger={this.props.telemetryLogger}
                            selection={this.state.selection}
                            dataFrameColumn={c}
                            dataFrameColumnIndex={c.index}
                            gridContextMenuPlugin={this.gridContextMenuPlugin}
                            gridSelectionPlugin={this.gridSelectionPlugin}
                            gridSortPlugin={this.gridSortPlugin}
                            gridFilterPlugin={this.gridFilterPlugin}
                            renderers={renderers}
                            disabled={!!this.props.disabled}
                            disableInteractions={!!this.props.disableInteractions}
                            disableCommitButton={!!this.props.disableCommitButton || !!this.props.disableInteractions}
                            columnAnnotations={c.annotations}
                            rootRef={ref as any}
                            tabIndex={tabIndex}
                            onHeaderContextMenuShown={this.props.onHeaderContextMenuShown}
                            activeHistoryIndex={activeHistoryDataFrame?.historyItem.index}
                            activeDataFrameHeader={activeDataFrame}
                            isEditingLastOperation={isEditingLastOperation}
                            lastAppliedOperationHasUpdates={lastAppliedOperationHasUpdates}
                            activeHistoryDataFrameHeader={activeHistoryDataFrame}
                        >
                            {c.index === 0 ? null : (
                                <QuickInsights
                                    dataFrame={activeDataFrame}
                                    dfColumn={c}
                                    renderers={renderers}
                                    visualizationStyle={this.props.visualizationStyle}
                                    locale={this.props.locale}
                                    localizedStrings={localizedStrings}
                                    visualizationLocalizedStrings={this.props.visualizationLocalizedStrings}
                                    isCellFocused={props.isCellSelected}
                                    disableFetching={this.props.disableFetching}
                                />
                            )}
                        </ReactDataGridHeaderCell>
                    );
                }
            };

            // iterate over each plugin to see which additional properties should be added
            // e.g. a sort plugin might add extra metadata on the sort comparator etc
            return this.plugins.reduce((mergedColumnDefinition, currentPlugin) => {
                return currentPlugin.addColumnProperties(c, mergedColumnDefinition);
            }, columnDefinition);
        });
    }

    private getColumnDefinitions = () => {
        return this.state.columnDefinitions;
    };

    private setColumnDefinitions = (columnDefinitions: IReactDataGridColumn[]) => {
        this.setState({
            columnDefinitions
        });
    };

    private async loadRows(count: number) {
        const { activeDataFrame } = this.state;

        if (activeDataFrame && !this.props.disableFetching) {
            // If we have less than the requested count, load more rows
            let rowData = activeDataFrame.getLoadedRows();
            if (rowData.length < count && rowData.length < activeDataFrame.rowCount) {
                rowData = await activeDataFrame.loadRows(count);
            }

            // Need to slice to ensure the reference is different
            rowData = rowData.slice();
            if (rowData.length !== this.state.rowData.length) {
                this.setState({ rowData });
            }
        }
    }

    componentDidMount() {
        void this.loadRows(rowChunkSize);
    }

    static getDerivedStateFromError(error: Error) {
        // RDG has an issue when an editor is open and the column is removed.
        // We swallow the error here as simply re-rendering RDG mitigates the issue.
        // See the issue here: https://github.com/adazzle/react-data-grid/issues/3136
        if (error.name === "TypeError" && error.message.includes("colSpan")) {
            return {};
        } else {
            throw error;
        }
    }

    componentDidUpdate(prevProps: IReactDataGridProps, prevState: IReactDataGridState) {
        const { disableCommitButton, disabled, disableFetching } = this.props;
        const { activeDataFrame } = this.state;

        if (prevState.rowData !== this.state.rowData && this.state.rowData.length) {
            this.props.onRowsLoaded?.(this.state.rowData);
        }

        if (
            prevState.activeDataFrame !== activeDataFrame ||
            // refresh styling if commit button disable status is updated
            prevProps.disableCommitButton !== disableCommitButton ||
            prevProps.disabled !== disabled ||
            prevProps.disableFetching !== disableFetching
        ) {
            // keep the staged edit in case of an error
            if (!activeDataFrame?.displayedDueToError) {
                this.stagedEdit = undefined;
            }
            this.gridContextMenuPlugin.dismissAll();
            if (activeDataFrame) {
                const columns = this.generateColumns(activeDataFrame);
                const rowData = activeDataFrame.getLoadedRows().slice();
                this.setState({
                    columnDefinitions: columns,
                    rowData
                });
                // Load as many rows as we need to show the same scroll position.
                const scrolledRows = Math.floor((this.grid.current?.element?.scrollTop ?? 0) / rowHeight);
                void this.loadRows(rowChunkSize + scrolledRows);
            } else {
                this.setState({
                    columnDefinitions: [],
                    rowData: []
                });
            }

            // if we were previously non-editable, but now are then we should focus the first visible editor
            const dfHasEditableCells = this.state.activeDataFrame?.columns.some((c) => {
                return !!c.annotations?.editableCells;
            });
            const dfSigCells = this.state.activeDataFrame?.columns.find(
                (column) => column.annotations?.significantCells?.length ?? 0 > 0
            );
            if (dfHasEditableCells && this.state.activeDataFrame !== prevState.activeDataFrame) {
                const editsAreDifferent = !deepEqual(
                    { gridCellEdits: this.state.activeDataFrame?.historyItem.gridCellEdits },
                    { gridCellEdits: prevState.activeDataFrame?.historyItem.gridCellEdits }
                );

                // case 1: if there is currently a staged edit which resulted in an error, scroll to it
                let cellPromise: Promise<HTMLDivElement | null | undefined> | undefined;
                if (editsAreDifferent && this.state.activeDataFrame?.displayedDueToError && this.stagedEdit) {
                    cellPromise = this.scrollToRow(
                        this.stagedEdit.row,
                        ".wrangler-grid-cell.wrangler-grid-cell-edited-failure"
                    ).then((cell) => {
                        return cell as HTMLDivElement;
                    });
                } else if (editsAreDifferent && dfSigCells) {
                    // case 2: if there are significant cells, scroll to the first one in the list
                    cellPromise = this.scrollToRow(
                        dfSigCells.annotations!.significantCells![0],
                        ".wrangler-grid-cell.wrangler-grid-cell-significant-input"
                    ).then((cell) => {
                        return cell as HTMLDivElement;
                    });
                } else if (!prevState.activeDataFrame?.isPreview && !prevState.activeDataFrame?.displayedDueToError) {
                    // case 3: we just started a new edit operation, scroll to the first visible cell
                    cellPromise = this.waitForGridElements(".wrangler-grid-cell.wrangler-grid-column-added")?.then(
                        (visibleCells) => {
                            // find the first visible row by intersecting with the grid itself
                            const gridRect = this.grid.current?.element?.getBoundingClientRect();
                            if (visibleCells && gridRect) {
                                const firstVisibleEditableCell = visibleCells.find((c) => {
                                    const cellRect = c.getBoundingClientRect();
                                    // add rowHeight to ignore the column header cells
                                    // subtract 1 to correct for slight offsets
                                    return cellRect.top >= gridRect.top + rowHeight - 1;
                                });
                                return firstVisibleEditableCell as HTMLDivElement;
                            }
                            return null;
                        }
                    );
                }

                cellPromise?.then((cell) => {
                    // double click on the first visible editable cell
                    if (cell) {
                        const doubleClickEvent = new MouseEvent("dblclick", {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        cell.dispatchEvent(doubleClickEvent);
                        // simulate an "Enter" press
                        const enterKeyEvent = new KeyboardEvent("keydown", {
                            bubbles: true,
                            cancelable: true,
                            key: "Enter"
                        });
                        cell.dispatchEvent(enterKeyEvent);
                    }
                }, null);
            }
        }

        // correct the selection state
        const { selection } = this.state;
        if (prevState.activeDataFrame !== this.state.activeDataFrame) {
            this.editInFlight = false;

            const foundInvalidColumns = selection.columns.some(
                (c) => this.state.activeDataFrame?.columns[c.index]?.name !== c.name
            );
            const foundInvalidRows = selection.rows.some(
                (r) => r.dataframeIndex > (this.state.activeDataFrame?.shape?.rows ?? 0)
            );
            const foundInvalidActiveCell =
                selection.activeCell &&
                (this.state.activeDataFrame?.columns[selection.activeCell.column.index]?.name !==
                    selection.activeCell.column.name ||
                    selection.activeCell.row.dataframeIndex > (this.state.activeDataFrame?.shape?.rows ?? 0));
            if (foundInvalidColumns || foundInvalidRows || foundInvalidActiveCell) {
                this.props.comms.ui.updateSelection({
                    columns: [],
                    rows: [],
                    isEntireTableSelected: false
                });
                this.setState({
                    selection: {
                        columns: [],
                        rows: [],
                        isEntireTableSelected: false
                    }
                });
            }
        }
    }

    private performGridEdit = (gridEdits: IGridCellEdit[], newEdit?: IGridCellEdit) => {
        let updatedGridEdits = gridEdits;
        if (newEdit) {
            const columnIndex = this.state.activeDataFrame?.columns?.[newEdit.column]?.index;
            if (columnIndex === undefined) {
                return;
            }
            // if we already had a staged edit we should remove it from the list of edits
            updatedGridEdits = updatedGridEdits.filter((edit) => edit.row !== this.stagedEdit?.row);
            updatedGridEdits.push(newEdit);
            this.stagedEdit = newEdit;
            this.setState((state) => ({
                rowData: state.rowData.map((row) => {
                    const rowIndex = row.index;
                    if (newEdit.row === rowIndex) {
                        return { ...row };
                    }
                    return row;
                })
            }));
        }
        if (!deepEqual(updatedGridEdits, this.props.gridCellEdits)) {
            this.editInFlight = true;
            this.props.comms.ui.updateEditedCells(updatedGridEdits);
        }
    };

    private async scrollToRow(rowIndex: number, cellSelector?: string) {
        // TODO@DW: load a specific page instead of the cumulative rows to improve perf
        await this.loadRows(rowIndex + rowChunkSize);
        this.grid.current?.scrollToRow(rowIndex);

        // wait for the row to become visible since RDG doesn't wait
        // +2 to account for header and also since the aria-label is 1-indexed
        const queriedElements = await this.waitForGridElements(
            `div.rdg-row[aria-rowindex="${rowIndex + 2}"] ${cellSelector}`
        );
        if (cellSelector && queriedElements?.[0]) {
            return queriedElements[0];
        }
        return;
    }

    public async scrollToColumn(columnIndex: number) {
        const gridElement = this.grid.current?.element;
        if (gridElement) {
            const scrollLeft = getColumnScrollLeft(
                columnIndex,
                this.columnWidths,
                gridElement.scrollWidth,
                gridElement.clientWidth
            );
            gridElement.scroll({
                left: scrollLeft,
                behavior: "smooth"
            });
            await waitForScrollEnd(gridElement);
            this.gridSelectionPlugin.selectColumn(columnIndex);
        }
    }

    private rerenderGrid = () => {
        // the entire grid is rerendered when any of the columns change
        this.setState((state) => ({
            columnDefinitions: [...state.columnDefinitions]
        }));
    };

    // debounce this to handle case where we're navigating with keyboard and holding the
    // arrow keys down to rapidly swap the column selection
    private rerenderGridDebounced = debounce(this.rerenderGrid, rerenderGridDebounceTime);

    public updateGridSelection(selection: ISelection) {
        this.updateGridSelectionInternal(selection, true);
    }

    private updateGridSelectionInternal = (selection: ISelection, isSynthetic?: boolean) => {
        this.gridSelectionPlugin.updateSelection(
            {
                rows: selection.rows.map((r) => r.gridIndex),
                columns: selection.columns.map((c) => c.index),
                activeCell: selection.activeCell
                    ? {
                          column: selection.activeCell.column.index,
                          row: selection.activeCell.row.gridIndex
                      }
                    : undefined,
                isEntireTableSelected: selection.isEntireTableSelected
            },
            !!isSynthetic
        );
    };

    private getRowDataWithLoadingRows = memoize(
        (dataFrame: IDataFrame | undefined, rows: IDataFrameRow[], showLoadingRows: boolean, sortColumn: {index: number, sortOrder: boolean} | undefined, _: string) => {
            console.log("@@@sortColumn2", sortColumn);
            const filteredRows = rows.filter((row) => this.gridFilterPlugin.filterData(row));
            const sortedRows = sortColumn ? filteredRows.sort((a, b) => {
                if (typeof a.data[sortColumn.index] === 'number' && typeof b.data[sortColumn.index] === 'number') {
                    return !sortColumn.sortOrder ? b.data[sortColumn.index] - a.data[sortColumn.index] : a.data[sortColumn.index] - b.data[sortColumn.index];
                }
                return !sortColumn.sortOrder ? String(b.data[sortColumn.index]).localeCompare(String(a.data[sortColumn.index])) : String(a.data[sortColumn.index]).localeCompare(String(b.data[sortColumn.index]))
            }) : filteredRows;
            console.log("@@sortedRows", sortedRows);
            if (dataFrame && showLoadingRows && rows.length < dataFrame.rowCount) {
                const maxLoadingRows = Math.min(numLoadingRows, dataFrame.rowCount - rows.length);
                const loadingRows = new Array<IDataFrameRow>(maxLoadingRows).fill({
                    // `undefined` values are treated as loading.
                    data: [],
                    index: -1
                });

                return sortedRows.concat(loadingRows);
            } else {
                return sortedRows;
            }
        }
    );

    render() {
        const { hidden, disableVirtualization, style } = this.props;
        const { activeDataFrame } = this.state;
        const gridClassName = classNames({
            // force light theme in the base implementation
            "rdg-light": true
        });
        console.log('@@RENDER RDG');
        const rows = this.getRowDataWithLoadingRows(
            this.state.activeDataFrame,
            this.state.rowData,
            !this.props.disableFetching,
            this.gridSortPlugin.getSortColumn(),
            this.gridFilterPlugin.getFilterId()
        );
        return (
            <div style={{ height: "100%", width: "100%", display: hidden ? "none" : undefined, ...style }}>
                <DataGrid
                    className={gridClassName}
                    ref={this.grid}
                    style={{ height: "100%" }}
                    columns={this.state.columnDefinitions}
                    rows={rows}
                    rowKeyGetter={(row: IDataFrameRow) => {
                        if (activeDataFrame) {
                            // negative indices are supported, so just return undefined here for loading cells
                            if (row.index < 0) {
                                return undefined as any;
                            }
                            return String(row.index);
                        } else {
                            return "";
                        }
                    }}
                    renderers={{
                        rowRenderer: (key: React.Key, props: RowRendererProps<IDataFrameRow>) => {
                            const rowIndex = props.row.index;
                            const isSelected = rowIndex >= 0 && this.gridSelectionPlugin.isRowSelected(rowIndex);

                            if (rowIndex >= 0) {
                                // hack: select the cell the moment it's rendered as selected
                                // this allows us to listen in on all selection events from RDG, e.g. keyboard etc.
                                if (
                                    rowIndex >= 0 &&
                                    props.selectedCellIdx !== undefined &&
                                    props.selectedCellIdx >= 0 &&
                                    (this.activeGridCell?.col !== props.selectedCellIdx ||
                                        (this.activeGridCell?.row !== rowIndex && props.selectedCellIdx !== undefined))
                                ) {
                                    this.gridSelectionPlugin.selectCell(rowIndex, props.selectedCellIdx);
                                }
                            }

                            // if any of the cells in this row are selected, then consider the entire row selected
                            const rowClassName = classNames({
                                "wrangler-grid-row-selected": props.selectedCellIdx !== undefined && isSelected,
                                "wrangler-grid-row-multi-selected": props.selectedCellIdx === undefined && isSelected
                            });
                            return <Row key={key} className={rowClassName} {...props} />;
                        }
                    }}
                    rowHeight={rowHeight}
                    onScroll={this.onScroll}
                    onColumnResize={(idx, width) => {
                        this.columnWidths[idx] = width;
                    }}
                    headerRowHeight={150}
                    enableVirtualization={!disableVirtualization}
                />
                <GridPluginRenderer
                    ref={this.pluginRenderer}
                    plugins={this.plugins}
                    gridProps={this.props}
                    selection={this.state.selection}
                    activeDataFrame={this.state.activeDataFrame}
                />
            </div>
        );
    }

    private onScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const { currentTarget } = event;
        const isAtBottom =
            // Add the height of the loading rows to the current scroll position.
            // This way we will start loading as soon as we start to hit those rows.
            currentTarget.scrollTop + numLoadingRows * rowHeight >=
            currentTarget.scrollHeight - currentTarget.clientHeight;

        if (isAtBottom && this.state.activeDataFrame) {
            const dataframe = this.state.activeDataFrame;
            const currentRows = this.state.rowData.length;
            if (currentRows < dataframe.rowCount) {
                void this.loadRows(currentRows + rowChunkSize);
            }
        }
    };

    private waitForGridElements(selector: string, timeout: number = 5000) {
        const gridElement = this.grid.current?.element;
        if (!gridElement) {
            return;
        }
        return Promise.race([
            new Promise<Element[]>((resolve) => {
                const elements = gridElement.querySelectorAll(selector);
                if (elements.length > 0) {
                    return resolve(Array.from(elements));
                }

                const observer = new MutationObserver(() => {
                    const elements = gridElement.querySelectorAll(selector);
                    if (elements.length > 0) {
                        resolve(Array.from(elements));
                        observer.disconnect();
                    }
                });

                observer.observe(gridElement, {
                    childList: true,
                    subtree: true
                });
            }),
            new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeout))
        ]);
    }
}
