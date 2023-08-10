import * as React from "react";
import type { IWranglerGridProps } from "../types";
import { BaseGridPlugin } from "./baseGridPlugin";
import { GridPluginRenderer } from "./gridPluginRenderer";

/**
 * Base grid plugin with rendering support.
 */
export abstract class BaseGridRenderPlugin<
    TCol,
    TColNew = TCol,
    TGridProps extends IWranglerGridProps = IWranglerGridProps
> extends BaseGridPlugin<TCol, TColNew, TGridProps> {
    constructor(
        getColumnDefinitionsInternal: () => TCol[],
        setColumnDefinitionsInternal: (columnDefinitions: TCol[]) => void,
        protected renderer: React.RefObject<GridPluginRenderer>
    ) {
        super(getColumnDefinitionsInternal, setColumnDefinitionsInternal);
    }
}
