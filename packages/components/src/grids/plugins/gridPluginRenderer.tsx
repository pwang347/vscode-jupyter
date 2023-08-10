import * as React from "react";
import type { IDataFrame, ISelection } from "@dw/messaging";
import type { IWranglerGridProps } from "../types";
import type { IGridPlugin } from "./types";

/**
 * Props for the grid plugin renderer.
 */
export interface IGridPluginRendererProps {
    activeDataFrame?: IDataFrame;
    plugins: IGridPlugin<any>[];
    gridProps: IWranglerGridProps;
    selection: ISelection;
}

/**
 * Renderer for grid plugin. This is a container that holds all rendered plugins.
 */
export class GridPluginRenderer extends React.PureComponent<IGridPluginRendererProps> {
    render() {
        const { plugins, gridProps, selection, activeDataFrame } = this.props;
        return (
            <div>
                {plugins.map((p) => {
                    if (!p.render) {
                        return null;
                    }
                    return <div key={p.id}>{p.render(gridProps, selection, activeDataFrame)}</div>;
                })}
            </div>
        );
    }
}
