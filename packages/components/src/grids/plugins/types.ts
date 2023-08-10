import type { ISelection, IDataFrameColumn, IDataFrame } from "@dw/messaging";
import type { IWranglerGridProps } from "../types";

/**
 * A plugin for the data wrangler grid. This is an abstraction used to dynamically modify the column definition schema
 * as well as rendering custom content.
 */
export interface IGridPlugin<
    TColBase,
    TColExtended = TColBase,
    TGridProps extends IWranglerGridProps = IWranglerGridProps
> {
    id: string;
    addColumnProperties: (dataFrameColumn: IDataFrameColumn, columnDefinition: TColBase) => TColBase & TColExtended;
    render?: (props: TGridProps, selection: ISelection, activeDataFrame?: IDataFrame) => JSX.Element;
}
