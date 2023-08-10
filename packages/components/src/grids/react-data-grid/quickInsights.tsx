import * as React from "react";
import {
    IDataFrame,
    IColumnVisualizationType,
    IDataFrameColumn,
    ICategoricalVisualization,
    IDateTimeVisualization,
    INumericalVisualization,
    IBooleanVisualization,
    IColumnVisualization,
    IDataFrameColumnStats
} from "@dw/messaging";

import { renderCustom } from "../../customRender";
import { IVisualizationRenderers, IVisualizationStyle, VisualizationProps } from "../types";

import { formatPercent } from "../helpers";
import { LocalizedStrings } from "../../localization";

/*
 * Props for the quick insights component.
 */
export interface IQuickInsightsProps {
    dataFrame: IDataFrame;
    dfColumn: IDataFrameColumn;
    renderers?: IVisualizationRenderers;
    visualizationStyle?: IVisualizationStyle;
    locale: string;
    localizedStrings: typeof LocalizedStrings.Grid;
    visualizationLocalizedStrings: typeof LocalizedStrings.Visualization;
    isCellFocused: boolean;
    disableFetching?: boolean;
}

/**
 * State for the quick insights component.
 */
export interface IQuickInsightsState {
    stats: IDataFrameColumnStats | null;
}

/**
 * React component for quick insights.
 */
export class QuickInsights extends React.PureComponent<IQuickInsightsProps, IQuickInsightsState> {
    state: IQuickInsightsState = {
        stats: null
    };

    private async loadInsights() {
        const { dataFrame, dfColumn } = this.props;

        if (dataFrame) {
            let stats = dataFrame.tryGetColumnStats(dfColumn.index);

            // Always `setState` immediately to avoid showing stale data when the dataframe changes.
            this.setState({ stats });
            if (!stats && !this.props.disableFetching) {
                stats = await dataFrame.loadColumnStats(dfColumn.index);
                this.setState({ stats });
            }
        } else {
            this.setState({ stats: null });
        }
    }

    componentDidMount() {
        void this.loadInsights();
    }

    componentDidUpdate(prevProps: IQuickInsightsProps) {
        if (this.props.dataFrame !== prevProps.dataFrame) {
            void this.loadInsights();
        } else if (prevProps.disableFetching && !this.props.disableFetching) {
            void this.loadInsights();
        }
    }

    // TODO@DW: localize
    render() {
        const { stats } = this.state;
        return (
            <div className="wrangler-insights-wrapper">
                {stats ? (
                    <React.Fragment>
                        {this.renderStats()}
                        <div className="wrangler-insights-visualization">{this.renderVisualization()}</div>
                    </React.Fragment>
                ) : (
                    <div className="wrangler-insights-loading-placeholder">
                        {this.props.disableFetching
                            ? this.props.localizedStrings.QuickInsightsPaused
                            : this.props.localizedStrings.QuickInsightsLoading}
                    </div>
                )}
            </div>
        );
    }

    private renderStats() {
        const { stats } = this.state;
        if (!stats) {
            return null;
        }

        const { dfColumn: column, localizedStrings } = this.props;

        function renderRow(label: string, count?: number) {
            if (count === undefined) {
                return null;
            }

            return (
                <div className="wrangler-insights-stats-row">
                    <span>{label}:</span>
                    <span className="noshrink">
                        {count} ({formatPercent(count, column.totalCount)})
                    </span>
                </div>
            );
        }

        // TODO@DW: localize
        switch (stats.visualization?.type) {
            case IColumnVisualizationType.Boolean:
                return (
                    <div className="wrangler-insights-stats">
                        {renderRow(localizedStrings.QuickInsightsMissingLabel, stats.missingCount)}
                        {renderRow(localizedStrings.QuickInsightsFalseLabel, stats.visualization.falseCount)}
                        {renderRow(localizedStrings.QuickInsightsTrueLabel, stats.visualization.trueCount)}
                    </div>
                );
            default:
                return (
                    <div className="wrangler-insights-stats">
                        {renderRow(localizedStrings.QuickInsightsMissingLabel, stats.missingCount)}
                        {renderRow(localizedStrings.QuickInsightsUniqueLabel, stats.uniqueCount)}
                    </div>
                );
        }
    }

    private renderVisualization() {
        const { stats } = this.state;
        if (!stats) {
            return null;
        }

        const { dfColumn: column } = this.props;
        const { visualization } = stats;

        if (!visualization) {
            return this.renderDefaultVisualization(stats);
        }

        switch (visualization.type) {
            case IColumnVisualizationType.Categorical:
                return this.renderCategoricalVisualization(column, visualization);
            case IColumnVisualizationType.Numerical:
                return this.renderNumericalVisualization(column, visualization);
            case IColumnVisualizationType.DateTime:
                return this.renderDateTimeVisualization(column, visualization);
            case IColumnVisualizationType.Boolean:
                return this.renderBooleanVisualization(column, visualization);
        }
    }

    private getVisualizationStyle() {
        return (
            this.props.visualizationStyle || {
                primaryColor: "#3794ff",
                secondaryColor: "#b180d7",
                outlinesOnly: false,
                backgroundColor: "#ffffff",
                foregroundColor: "#000000"
            }
        );
    }

    private getVisualizationProps<T extends IColumnVisualization>(visualization: T): VisualizationProps<T> {
        return {
            visualization,
            column: this.props.dfColumn,
            style: this.getVisualizationStyle(),
            locale: this.props.locale,
            localizedStrings: this.props.visualizationLocalizedStrings,
            enableFocus: this.props.isCellFocused
        };
    }

    private renderDefaultVisualization(stats: IDataFrameColumnStats) {
        const { primaryColor } = this.getVisualizationStyle();

        return (
            <div className="wrangler-insights-default-visualization">
                <div className="wrangler-insights-default-visualization-value" style={{ color: primaryColor }}>
                    {stats.uniqueCount}
                </div>
                <div className="wrangler-insights-default-visualization-label">
                    {this.props.localizedStrings.QuickInsightsUniqueValuesLabel}
                </div>
            </div>
        );
    }

    private renderBooleanVisualization(_: IDataFrameColumn, vis: IBooleanVisualization) {
        return renderCustom({
            props: this.getVisualizationProps(vis),
            defaultRender: () => null,
            customRender: this.props.renderers?.onRenderBooleanVisualization
        });
    }

    private renderNumericalVisualization(_: IDataFrameColumn, vis: INumericalVisualization) {
        return (
            <React.Fragment>
                {renderCustom({
                    props: this.getVisualizationProps(vis),
                    defaultRender: () => null,
                    customRender: this.props.renderers?.onRenderNumericalVisualization
                })}
                <div className="wrangler-insights-visualization-min-max">
                    <span>
                        {this.props.localizedStrings.QuickInsightsMinLabel} {vis.min}
                    </span>
                    <span>
                        {this.props.localizedStrings.QuickInsightsMaxLabel} {vis.max}
                    </span>
                </div>
            </React.Fragment>
        );
    }

    private renderCategoricalVisualization(column: IDataFrameColumn, vis: ICategoricalVisualization) {
        return (
            <div>
                {vis.categories.map((c) => (
                    <div key={c.label} className="wrangler-insights-stats-row">
                        <span>{c.label}:</span>
                        <span className="noshrink">{formatPercent(c.count, column.totalCount)}</span>
                    </div>
                ))}
                {vis.other > 0 && (
                    <div className="wrangler-insights-stats-row">
                        <span>{this.props.localizedStrings.QuickInsightsOtherCategoryLabel}:</span>
                        <span className="noshrink">{formatPercent(vis.other, column.totalCount)}</span>
                    </div>
                )}
            </div>
        );
    }

    private renderDateTimeVisualization(_: IDataFrameColumn, vis: IDateTimeVisualization) {
        return (
            <div>
                <div className="wrangler-insights-stats-row">
                    <span className="noshrink">{this.props.localizedStrings.QuickInsightsMinLabel}:</span>
                    <span>{String(vis.min)}</span>
                </div>
                <div className="wrangler-insights-stats-row">
                    <span className="noshrink">{this.props.localizedStrings.QuickInsightsMaxLabel}:</span>
                    <span>{String(vis.max)}</span>
                </div>
            </div>
        );
    }
}
