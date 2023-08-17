// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IDataFrameColumn } from '@dw/messaging';
import { BaseGridRenderPlugin } from './baseGridRenderPlugin';

/**
 * Sort plugin.
 */
export interface IGridSortPlugin {
    clearSortColumn: () => void;
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
        this.clearSortColumn();
        this.setColumnDefinition(colIndex, { ...this.getColumnDefinition(colIndex), sortAsc });
        this.sortCol = {
            index: colIndex,
            sortOrder: sortAsc
        };
        console.log('@@RENDER');
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public clearSortColumn() {
        this.setColumnDefinitions(this.getColumnDefinitions().map((def) => ({ ...def, sortAsc: undefined })));
        this.sortCol = undefined;
        console.log('@@CLEAR');
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public addColumnProperties(
        _dataFrameColumn: IDataFrameColumn,
        columnDefinition: TCol
    ): TCol & { sortAsc: boolean | undefined } {
        return { ...columnDefinition, sortAsc: undefined };
    }
}
