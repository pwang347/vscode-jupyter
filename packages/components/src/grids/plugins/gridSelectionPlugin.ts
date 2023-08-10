import { BaseGridPlugin } from "./baseGridPlugin";
import { isAppleProduct } from "../helpers/environment";

/**
 * Selection plugin.
 */
export interface IGridSelectionPlugin {
    reset: () => void;
    isColumnSelected: (column: number) => boolean;
    isRowSelected: (row: number) => boolean;
    isCellSelected: (row: number, col: number) => boolean;
    getSelection: () => IGridSelection;
    selectColumn: (column: number, e?: MouseEvent) => void;
    selectCell: (row: number, col: number, e?: MouseEvent) => void;
    onSelectionChanged: (callback: SelectionChangedCallback) => ISelectionCallbackDisposable;
    updateSelection: (selection: IGridSelection, isSynthetic: boolean) => void;
    getRowSelectionDifference: (oldSelection: IGridSelection, newSelection: IGridSelection) => Set<number>;
    getColumnSelectionDifference: (oldSelection: IGridSelection, newSelection: IGridSelection) => Set<number>;
}

/**
 * A tuple representing a cell.
 */
interface IGridCellSelection {
    row: number;
    column: number;
}

/**
 * A selection state for a data grid.
 */
export interface IGridSelection {
    columns: number[];
    rows: number[];
    activeCell?: IGridCellSelection;
    isEntireTableSelected: boolean;
}

/**
 * Disposable result.
 */
interface ISelectionCallbackDisposable {
    dispose: () => void;
}

/**
 * Callback type for the selection changed event.
 */
export type SelectionChangedCallback = (
    oldSelection: IGridSelection,
    newSelection: IGridSelection,
    isSynthetic: boolean,
    isMouseEvent: boolean
) => void;

/**
 * Grid selection plugin.
 * Multiselect mechanics:
 * - Cell last selected with either a click or a ctrl + click is considered the anchor cell
 * - All cells between the anchor cell and the cell that is shift + clicked on are added to the multi-selection
 * - Any cells that were previously selected off of the anchor cell but are no longer between the anchor cell
 *   and the cell that is shift + clicked on are removed from the multi-selection
 */
export class GridSelectionPlugin<TCol> extends BaseGridPlugin<TCol> implements IGridSelectionPlugin {
    id = "selection";

    private selectionChangedCallbacks: SelectionChangedCallback[] = [];

    private selection: IGridSelection = {
        columns: [],
        rows: [],
        isEntireTableSelected: false
    };

    private columnSelectionSet: Set<number> = new Set();

    private rowSelectionSet: Set<number> = new Set();

    private anchorRow?: number;
    private anchorCol?: number;
    private previousRangeSelection?: {
        range: number[];
        anchorRow?: number;
        anchorCol?: number;
    };

    /**
     * Resets the selection state.
     */
    public reset() {
        this.updateSelection(
            {
                columns: [],
                rows: [],
                isEntireTableSelected: false
            },
            false,
            false
        );
    }

    /**
     * Returns true if the column index is selected.
     */
    public isColumnSelected(column: number) {
        return this.columnSelectionSet.has(column);
    }

    /**
     * Returns true if the row index is selected.
     */
    public isRowSelected(row: number) {
        return this.selection.isEntireTableSelected || this.rowSelectionSet.has(row);
    }

    /**
     * Returns true if the cell tuple is selected.
     */
    public isCellSelected(row: number, col: number) {
        return !!(
            this.selection.activeCell &&
            this.selection.activeCell.row === row &&
            this.selection.activeCell.column === col
        );
    }

    /** Returns the current grid selection. */
    public getSelection() {
        return this.selection;
    }

    /**
     * Selects the given column.
     */
    public selectColumn(column: number, e?: MouseEvent) {
        this.anchorRow = undefined;
        if (!e?.shiftKey) {
            this.anchorCol = column;
        }
        this.updateSelection(
            {
                columns: this.handleMultiSelect(column, this.selection.columns, false, e),
                rows: [],
                activeCell: {
                    row: -1,
                    column
                },
                isEntireTableSelected: false
            },
            false,
            !!e
        );
    }

    /**
     * Selects the given cell.
     */
    public selectCell(row: number, col: number, e?: MouseEvent) {
        if (this.selection.isEntireTableSelected) {
            return;
        }
        this.anchorCol = undefined;
        if (!e?.shiftKey) {
            this.anchorRow = row;
        }
        this.updateSelection(
            {
                columns: [],
                rows: this.handleMultiSelect(row, this.selection.rows, true, e),
                activeCell: {
                    row,
                    column: col
                },
                isEntireTableSelected: false
            },
            false,
            !!e
        );
    }

    /**
     * Event listener for selection changes.
     */
    public onSelectionChanged(callback: SelectionChangedCallback): ISelectionCallbackDisposable {
        this.selectionChangedCallbacks.push(callback);
        return {
            dispose: () => {
                this.selectionChangedCallbacks = this.selectionChangedCallbacks.filter((cb) => cb !== callback);
            }
        };
    }

    private handleMultiSelect(
        clickedIndex: number,
        originalSelectedIndexList: number[],
        isRow: boolean,
        e?: MouseEvent
    ): number[] {
        if (
            e &&
            e.shiftKey &&
            !e.ctrlKey &&
            !e.metaKey &&
            this.selection.activeCell &&
            (isRow ? this.selection.activeCell.row >= 0 : this.selection.activeCell.row === -1)
        ) {
            const firstIndex = isRow
                ? this.anchorRow ?? this.selection.activeCell.row
                : this.anchorCol ?? this.selection.activeCell.column;
            const secondIndex = clickedIndex;
            const rangeToRemove =
                (isRow && this.previousRangeSelection?.anchorRow === this.anchorRow) ||
                (!isRow && this.previousRangeSelection?.anchorCol === this.anchorCol)
                    ? this.previousRangeSelection?.range
                    : [];
            this.previousRangeSelection = {
                anchorCol: this.anchorCol,
                anchorRow: this.anchorRow,
                range: this.range(Math.min(firstIndex, secondIndex), Math.max(firstIndex, secondIndex))
            };
            const rangeToRemoveSet = new Set(rangeToRemove);
            const originalListSubtracted = originalSelectedIndexList.filter((index) => !rangeToRemoveSet.has(index));
            return Array.from(
                new Set(
                    originalListSubtracted.concat(
                        this.range(Math.min(firstIndex, secondIndex), Math.max(firstIndex, secondIndex))
                    )
                )
            );
            // TODO@DW: we need to actually check if command + click works on Mac
        } else if (e && !e.shiftKey && (isAppleProduct() ? e.metaKey : e.ctrlKey)) {
            if (originalSelectedIndexList.includes(clickedIndex)) {
                return originalSelectedIndexList.filter((i) => i !== clickedIndex);
            } else {
                return originalSelectedIndexList.concat([clickedIndex]);
            }
        } else {
            return [clickedIndex];
        }
    }

    private range(start: number, end: number) {
        return new Array(end - start + 1).fill(0).map((_, ind) => ind + start);
    }

    private areSetsEqual(a: Set<number>, b: Set<number>) {
        return a.size === b.size && Array.from(a).every((value) => b.has(value));
    }

    /**
     * Updates the selection state of the grid selection host.
     */
    public updateSelection(selection: IGridSelection, isSynthetic: boolean, isMouseEvent?: boolean) {
        const newColumnSelectionSet = new Set(selection.columns);
        const newRowSelectionSet = new Set(selection.rows);
        if (
            this.areSetsEqual(newColumnSelectionSet, this.columnSelectionSet) &&
            this.areSetsEqual(newRowSelectionSet, this.rowSelectionSet) &&
            selection.activeCell?.column === this.selection.activeCell?.column &&
            selection.activeCell?.row === this.selection.activeCell?.row &&
            selection.isEntireTableSelected === this.selection.isEntireTableSelected
        ) {
            return;
        }
        this.columnSelectionSet = newColumnSelectionSet;
        this.rowSelectionSet = newRowSelectionSet;
        const oldSelection = this.selection;
        this.selection = selection;
        for (const cb of this.selectionChangedCallbacks) {
            cb(
                oldSelection,
                {
                    columns: [...selection.columns],
                    rows: [...selection.rows],
                    activeCell: selection.activeCell ? { ...selection.activeCell } : undefined,
                    isEntireTableSelected: selection.isEntireTableSelected
                },
                isSynthetic,
                !!isMouseEvent
            );
        }
    }

    /**
     * Computes the set of row indices that have changed.
     */
    public getRowSelectionDifference(oldSelection: IGridSelection, newSelection: IGridSelection) {
        const rowIndexSet = new Set<number>();
        const oldSelectionColumnsSet = new Set(oldSelection.columns);
        if (
            newSelection.columns.length === oldSelectionColumnsSet.size &&
            newSelection.columns.every((c) => oldSelectionColumnsSet.has(c))
        ) {
            const oldSelectionRowsSet = new Set(oldSelection.rows);
            const newSelectionRowsSet = new Set(newSelection.rows);
            for (const row of oldSelection.rows) {
                if (!newSelectionRowsSet.has(row)) {
                    rowIndexSet.add(row);
                }
            }
            for (const row of newSelection.rows) {
                if (!oldSelectionRowsSet.has(row)) {
                    rowIndexSet.add(row);
                }
            }
        }
        return rowIndexSet;
    }

    /**
     * Computes the set of column indices that have changed.
     */
    public getColumnSelectionDifference(oldSelection: IGridSelection, newSelection: IGridSelection) {
        const columnIndexSet = new Set<number>();
        const oldSelectionColsSet = new Set(oldSelection.columns);
        const newSelectionColsSet = new Set(newSelection.columns);
        for (const col of oldSelection.columns) {
            if (!newSelectionColsSet.has(col)) {
                columnIndexSet.add(col);
            }
        }
        for (const col of newSelection.columns) {
            if (!oldSelectionColsSet.has(col)) {
                columnIndexSet.add(col);
            }
        }
        return columnIndexSet;
    }
}
