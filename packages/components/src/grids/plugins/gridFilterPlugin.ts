// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IDataFrameColumn, IDataFrameRow } from '@dw/messaging';
import { BaseGridRenderPlugin } from './baseGridRenderPlugin';

/**
 * Filter plugin.
 */
export interface IGridFilterPlugin {
    clearFilter: (colIndex: number) => void;
    filterColumn: (colIndex: number, filter: string) => void;
    getColumnFilter: (colIndex: number) => string;
    filterData: (row: IDataFrameRow) => boolean;
    getFilterId: () => string;
}

export class GridFilterPlugin<TCol extends { index: number }>
    extends BaseGridRenderPlugin<
        TCol,
        {
            filter: string;
        }
    >
    implements IGridFilterPlugin
{
    id = 'filter';

    public getFilterId() {
        return this.getColumnDefinitions()
            .map((col) => col.filter)
            .join(',');
    }

    public filterData(row: IDataFrameRow) {
        for (const columnDefinition of this.getColumnDefinitions()) {
            if (
                columnDefinition.filter &&
                !String(row.data[columnDefinition.index]).startsWith(columnDefinition.filter)
            ) {
                return false;
            }
        }
        return true;
    }

    public filterColumn(colIndex: number, filter: string) {
        this.setColumnDefinition(colIndex, { ...this.getColumnDefinition(colIndex), filter });
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public getColumnFilter(colIndex: number) {
        return this.getColumnDefinition(colIndex).filter;
    }

    public clearFilter(colIndex: number) {
        this.setColumnDefinitions(
            this.getColumnDefinitions().map((def) => (colIndex === def.index ? { ...def, filter: '' } : def))
        );
        setTimeout(() => {
            this.renderer.current?.forceUpdate();
        }, 0);
    }

    public addColumnProperties(_dataFrameColumn: IDataFrameColumn, columnDefinition: TCol): TCol & { filter: string } {
        return { ...columnDefinition, filter: '' };
    }
}
