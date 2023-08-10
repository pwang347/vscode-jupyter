import type { IGridPlugin } from "./types";
import type { IWranglerGridProps } from "../types";
import { IDataFrameColumn } from "@dw/messaging";

/**
 * Base grid plugin. Provides helpers to return typed column definitions.
 */
export abstract class BaseGridPlugin<TCol, TColNew = TCol, TGridProps extends IWranglerGridProps = IWranglerGridProps>
    implements IGridPlugin<TCol, TColNew, TGridProps>
{
    abstract id: string;
    constructor(
        private getColumnDefinitionsInternal: () => TCol[],
        private setColumnDefinitionsInternal: (columnDefinitions: TCol[]) => void
    ) {}

    /**
     * Helper to retrieve column definitions using the extension typing.
     */
    protected getColumnDefinitions() {
        return this.getColumnDefinitionsInternal() as unknown as Array<TCol & TColNew>;
    }

    /**
     * Helper to retrieve a column definition using the extension typing. If it does not exist, then this returns undefined.
     */
    protected getColumnDefinition(colIndex: number) {
        return this.getColumnDefinitions()[colIndex] as unknown as TCol & TColNew;
    }

    /**
     * Helper to update a column definition. If it does not exist, this returns an error.
     */
    protected setColumnDefinition(colIndex: number, columnDefinition: TCol & TColNew) {
        const columnDefinitions = [...this.getColumnDefinitions()];
        if (colIndex < 0 || colIndex >= columnDefinitions.length) {
            throw new Error("Invalid column index");
        }
        columnDefinitions[colIndex] = columnDefinition;
        this.setColumnDefinitionsInternal(columnDefinitions as unknown as TCol[]);
    }

    /**
     * Helper to update all column definitions.
     */
    protected setColumnDefinitions(columnDefinitions: TColNew[]) {
        this.setColumnDefinitionsInternal(columnDefinitions as unknown as TCol[]);
    }

    /**
     * Adds additional extension properties to a column definition.
     */
    public addColumnProperties(_dataFrameColumn: IDataFrameColumn, columnDefinition: TCol): TCol & TColNew {
        return columnDefinition as unknown as TCol & TColNew;
    }
}
