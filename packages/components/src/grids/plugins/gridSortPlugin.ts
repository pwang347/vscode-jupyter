// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IDataFrameColumn } from '@dw/messaging';
import { BaseGridRenderPlugin } from './baseGridRenderPlugin';

/**
 * Sort plugin.
 */
export interface IGridSortPlugin {
    clearAllSortColumns: () => void;
    clearSortColumn: (colIndex: number) => void;
    sortColumn: (colIndex: number, sortAsc: boolean) => void;
    getSortColumn: () =>
        | {
              index: number;
              sortOrder: boolean;
          }
        | undefined;
}

export class GridSortPlugin<TCol>
    extends BaseGridRenderPlugin<
        TCol,
        {
            sortAsc: boolean | undefined;
        }
    >
    implements IGridSortPlugin
{
    id = 'sort';

    private sortCol?: {
        index: number;
        sortOrder: boolean;
    };

    public getSortColumn() {
        return this.sortCol;
    }

    public sortColumn(colIndex: number, sortAsc: boolean) {
        this.clearAllSortColumns();
        this.setColumnDefinition(colIndex, { ...this.getColumnDefinition(colIndex), sortAsc });
        this.sortCol = {
            index: colIndex,
            sortOrder: sortAsc
        };
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public clearAllSortColumns() {
        this.setColumnDefinitions(this.getColumnDefinitions().map((def) => ({ ...def, sortAsc: undefined })));
        this.sortCol = undefined;
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public clearSortColumn(colIndex: number) {
        if (this.sortCol?.index === colIndex) {
            this.clearAllSortColumns();
        }
    }

    public addColumnProperties(
        _dataFrameColumn: IDataFrameColumn,
        columnDefinition: TCol
    ): TCol & { sortAsc: boolean | undefined } {
        return { ...columnDefinition, sortAsc: undefined };
    }
}
