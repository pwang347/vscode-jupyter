import * as React from "react";
import {
    ColumnType,
    formatString,
    IDataFrame,
    IDataFrameColumnStats,
    IDataFrameStats,
    IHistoryItem,
    ISelection,
    isPreviewingUpdatesToLastAppliedOperation,
    PreviewAnnotationType
} from "@dw/messaging";

import "./summaryPanel.scss";
import { LocalizedStrings } from "../../localization";
import { IRenderFunction, renderCustom } from "../../customRender";
import { FoldSectionItem } from "./foldSection";

/**
 * Class of summary value.
 */
export enum SummaryValueType {
    Default = "default",
    Warning = "warning"
}

/**
 * Props for a summary row.
 */
export interface ISummaryRow {
    label: string;
    value: string;
    tooltip?: string;
    type?: SummaryValueType;
}

/**
 * Props for wrangler summary panel.
 */
interface IWranglerSummaryPanelProps {
    dataFrame?: IDataFrame;
    activeHistoryDataFrame?: IDataFrame;
    selection: ISelection;
    enableViewingPastCodeStepsWithData: boolean;
    enableEditLastAppliedOperation: boolean;
    historyItems: IHistoryItem[];
    decimalCount?: number;
    locStrings?: typeof LocalizedStrings.Summary;
    localizeNumber?: (n: number, maxDecimalCount?: number, minDecimalCount?: number) => string;
    renderers?: {
        onRenderSummaryRow?: IRenderFunction<ISummaryRow>;
        onRenderRowsSubGroup?: IRenderFunction<{
            groupContent: JSX.Element;
            label: string;
            rowsCountLabel: string;
        }>;
        onRenderMissingValuesSubGroup?: IRenderFunction<{
            groupContent: JSX.Element;
            label: string;
            totalMissingValuesLabel: string;
        }>;
        onRenderStatisticsSubGroup?: IRenderFunction<{
            groupContent: JSX.Element;
            advancedGroupContent: JSX.Element;
        }>;
        onRenderCategoricalSubGroup?: IRenderFunction<{
            groupContent: JSX.Element;
        }>;
    };
    onStatsLoaded?: (stats: IDataFrameStats) => void;
}

/**
 * State for wrangler summary panel.
 */
interface IWranglerSummaryPanelState {
    stats: IDataFrameStats | null;
    columnStats: Record<number, IDataFrameColumnStats>;
    activeDataFrame?: IDataFrame;
}

const DefaultDecimalPlace = 3;

/**
 * Summary information for data frames.
 */
export class SummaryPanel extends React.PureComponent<IWranglerSummaryPanelProps, IWranglerSummaryPanelState> {
    state: IWranglerSummaryPanelState = {
        stats: null,
        columnStats: {}
    };

    static getDerivedStateFromProps(props: IWranglerSummaryPanelProps): Partial<IWranglerSummaryPanelState> | null {
        const lastAppliedOperationHasUpdates = isPreviewingUpdatesToLastAppliedOperation({
            dataFrameHeader: props.dataFrame,
            historyItemsLength: props.historyItems.length,
            enableEditLastAppliedOperation: props.enableEditLastAppliedOperation
        });
        if (
            props.enableViewingPastCodeStepsWithData &&
            props.activeHistoryDataFrame &&
            !lastAppliedOperationHasUpdates
        ) {
            return {
                activeDataFrame: props.activeHistoryDataFrame
            };
        }
        return {
            activeDataFrame: props.dataFrame
        };
    }

    private async loadStats() {
        const { activeDataFrame } = this.state;

        if (activeDataFrame) {
            let stats = activeDataFrame.tryGetStats();
            let columnStats = activeDataFrame.getLoadedColumnStats();
            const selectedColumnIndex = this.getSelectedColumnIndex();

            // Always `setState` immediately to avoid showing stale data when the data frame changes.
            this.setState({ stats, columnStats });

            const loadingPromises: PromiseLike<unknown>[] = [];
            if (!stats) {
                loadingPromises.push(activeDataFrame.loadStats());
            }
            if (selectedColumnIndex !== null && !columnStats.hasOwnProperty(selectedColumnIndex)) {
                loadingPromises.push(activeDataFrame.loadColumnStats(selectedColumnIndex));
            }

            if (loadingPromises.length > 0) {
                await Promise.all(loadingPromises);
                this.setState({
                    stats: activeDataFrame.tryGetStats(),
                    columnStats: { ...activeDataFrame.getLoadedColumnStats() }
                });
            }
        } else {
            this.setState({ stats: null, columnStats: {} });
        }
    }

    componentDidMount() {
        this.loadStats();
    }

    componentDidUpdate(prevProps: IWranglerSummaryPanelProps, prevState: IWranglerSummaryPanelState) {
        if (this.state.activeDataFrame !== prevState.activeDataFrame || this.props.selection !== prevProps.selection) {
            this.loadStats();
        }

        if (prevState.stats === null && this.state.stats !== null) {
            this.props.onStatsLoaded?.(this.state.stats);
        }
    }

    getLocalizedStrings() {
        const { locStrings } = this.props;
        return locStrings ?? LocalizedStrings.Summary;
    }

    getLocalizedNumber(n: number | string | undefined, maxDecimalCount?: number, minDecimalCount?: number) {
        // TODO@DW: we need to check for strings since we currently return NaN as a string - we should look into a better
        // representation such as `undefined` or `null`
        if (n === undefined || typeof n === "string") {
            return n;
        }
        const { localizeNumber } = this.props;
        if (!localizeNumber) {
            return n.toString();
        }

        return localizeNumber(n, maxDecimalCount, minDecimalCount);
    }

    renderSummaryRow(row: ISummaryRow) {
        const { renderers } = this.props;
        const { label, value, tooltip, type } = row;
        return renderCustom({
            props: {
                label,
                value,
                tooltip,
                type: type ?? SummaryValueType.Default
            },
            defaultRender: (props) => (
                <FoldSectionItem
                    key={`summary-row-${props.label}`}
                    aria-label={`${props.label} ${props.value}`}
                    className="wrangler-summary-row-wrapper"
                >
                    <div className="wrangler-summary-row-content">
                        <React.Fragment>{props.label}</React.Fragment>
                        <div className="wrangler-summary-secondary-text">{props.value}</div>
                    </div>
                </FoldSectionItem>
            ),
            customRender: renderers?.onRenderSummaryRow
        });
    }

    getDataFrameShapeString(shape: { rows: number; columns: number }) {
        const locStrings = this.getLocalizedStrings();
        const rows = shape.rows;
        const columns = shape.columns;

        const rowsString = `${formatString(
            rows === 1 ? locStrings.DataFrameShapeRow : locStrings.DataFrameShapeRowPlural,
            this.getLocalizedNumber(rows)
        )}`;
        const columnsString = `${formatString(
            columns === 1 ? locStrings.DataFrameShapeColumn : locStrings.DataFrameShapeColumnPlural,
            this.getLocalizedNumber(columns)
        )}`;

        return `${rowsString} x ${columnsString}`;
    }

    getSelectedColumnIndex() {
        const { selection } = this.props;
        return selection.columns.length > 0 ? selection.columns[selection.columns.length - 1].index : null;
    }

    renderDataframeStatistics() {
        const { renderers } = this.props;
        const { activeDataFrame, stats } = this.state;
        const locStrings = this.getLocalizedStrings();

        // If we have a data frame, but not stats, they are still loading.
        const missingString = activeDataFrame && !stats ? locStrings.Loading : locStrings.MissingData;

        const dfData: ISummaryRow[] = [
            {
                label: locStrings.DataFrameShape,
                value: activeDataFrame?.shape ? this.getDataFrameShapeString(activeDataFrame?.shape) : missingString,
                ...(activeDataFrame?.wasInitialDataTruncated && {
                    type: SummaryValueType.Warning,
                    tooltip: locStrings.DataFrameTruncatedStatisticsWarning
                })
            },
            {
                label: locStrings.DataFrameNumColumns,
                value: this.getLocalizedNumber(activeDataFrame?.shape.columns) ?? missingString
            }
        ];

        const missingValue = this.getLocalizedNumber(stats?.missingValueRowsCount) ?? missingString;
        const duplicateRows = this.getLocalizedNumber(stats?.duplicateRowsCount) ?? missingString;

        const toPercentage = (value: number, rows: number): string =>
            formatString(locStrings.Percentage, ((value * 100) / rows).toFixed(1));

        let missingPercentage = missingString;
        let duplicatePercentage = missingString;
        if (activeDataFrame && stats && activeDataFrame.shape.rows > 0) {
            missingPercentage = toPercentage(stats.missingValueRowsCount, activeDataFrame.shape.rows);
            duplicatePercentage = toPercentage(stats.duplicateRowsCount, activeDataFrame.shape.rows);
        }

        const rowData = [
            {
                label: locStrings.DataFrameNumRowsMissingValue,
                value: `${missingValue} (${missingPercentage})`
            },
            {
                label: locStrings.DataFrameNumDuplicateRows,
                value: `${duplicateRows} (${duplicatePercentage})`
            }
        ];
        let missingValuesData: Array<{ label: string; value: string }> = [];
        if (activeDataFrame && stats) {
            const columnsWithMissingValues = activeDataFrame.columns.filter((column) => {
                const missingCount = stats.missingValuesByColumn[column.index];
                return missingCount && column.annotations?.annotationType !== PreviewAnnotationType.Removed;
            });
            missingValuesData = columnsWithMissingValues.map((c) => ({
                label: c.name,
                value: this.getLocalizedNumber(stats.missingValuesByColumn[c.index]!) ?? missingString
            }));
        }

        const missingValuesContent = missingValuesData.map((r) => this.renderSummaryRow(r));

        return (
            <React.Fragment>
                {dfData.map((r) => this.renderSummaryRow(r))}
                {renderCustom({
                    props: {
                        groupContent: <React.Fragment>{rowData.map((r) => this.renderSummaryRow(r))}</React.Fragment>,
                        rowsCountLabel: this.getLocalizedNumber(activeDataFrame?.shape.rows) ?? missingString,
                        label: locStrings.DataFrameNumRowsHeading
                    },
                    defaultRender: (props) => <React.Fragment>{props.groupContent}</React.Fragment>,
                    customRender: renderers?.onRenderRowsSubGroup
                })}
                {renderCustom({
                    props: {
                        groupContent: missingValuesContent.length ? (
                            <React.Fragment>{missingValuesContent}</React.Fragment>
                        ) : (
                            <FoldSectionItem
                                key="summary-row-no-missing-values"
                                aria-label="no-missing-values"
                                className="wrangler-summary-row-wrapper"
                            >
                                <div className="wrangler-summary-row-content">{locStrings.DataFrameNoMissingValue}</div>
                            </FoldSectionItem>
                        ),
                        totalMissingValuesLabel:
                            this.getLocalizedNumber(stats?.missingValueCellsCount) ?? missingString,
                        label: locStrings.DataFrameMissingValuesHeading
                    },
                    defaultRender: (props) => <React.Fragment>{props.groupContent}</React.Fragment>,
                    customRender: renderers?.onRenderMissingValuesSubGroup
                })}
            </React.Fragment>
        );
    }

    renderColumnStatistics(index: number) {
        const { decimalCount, renderers } = this.props;
        const { activeDataFrame, columnStats } = this.state;
        const locStrings = this.getLocalizedStrings();
        const selectedColumn = activeDataFrame?.columns[index];
        const selectedColumnStats = selectedColumn && columnStats[index];

        let displayedType;
        if (selectedColumn?.rawType) {
            if (selectedColumn?.isMixed) {
                displayedType = formatString(locStrings.DataTypeMixed, selectedColumn?.rawType);
            } else {
                displayedType = selectedColumn?.rawType;
            }
        } else {
            displayedType = locStrings.MissingData;
        }

        // common column summary information
        const rows: ISummaryRow[] = [
            {
                label: locStrings.DataType,
                value: displayedType,
                tooltip:
                    selectedColumn?.type === ColumnType.Unknown || selectedColumn?.isMixed
                        ? locStrings.DataTypeUnsupportedWarning
                        : undefined,
                type:
                    selectedColumn?.type === ColumnType.Unknown || selectedColumn?.isMixed
                        ? SummaryValueType.Warning
                        : undefined
            }
        ];

        // If we have a data frame, but not stats, they are still loading.
        const missingString = activeDataFrame && !this.state.stats ? locStrings.Loading : locStrings.MissingData;

        // don't include these stats for the index column
        if (index > 0) {
            rows.push(
                ...[
                    {
                        label: locStrings.DataFrameNumRowsHeading,
                        value: this.getLocalizedNumber(selectedColumn?.totalCount) ?? locStrings.MissingData
                    },
                    {
                        label: locStrings.UniqueValues,
                        value: this.getLocalizedNumber(selectedColumnStats?.uniqueCount) ?? missingString
                    },
                    {
                        label: locStrings.MissingValues,
                        value: this.getLocalizedNumber(selectedColumnStats?.missingCount) ?? missingString
                    }
                ]
            );
        }

        // numerical summary information
        const statsRows = [];
        const advancedStatsRows = [];
        const usedDecimalCount = decimalCount ?? DefaultDecimalPlace;
        if (selectedColumnStats?.numericalData) {
            statsRows.push(
                {
                    label: locStrings.StatisticsAverage,
                    value:
                        this.getLocalizedNumber(selectedColumnStats.numericalData.mean, usedDecimalCount) ??
                        locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsStandardDeviation,
                    value:
                        this.getLocalizedNumber(selectedColumnStats.numericalData.std, usedDecimalCount) ??
                        locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsMin,
                    value: this.getLocalizedNumber(selectedColumnStats.numericalData.min) ?? locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsLowerQuartile,
                    value: this.getLocalizedNumber(selectedColumnStats.numericalData["25%"]) ?? locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsMedian,
                    value: this.getLocalizedNumber(selectedColumnStats.numericalData.median) ?? locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsUpperQuartile,
                    value: this.getLocalizedNumber(selectedColumnStats.numericalData["75%"]) ?? locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsMax,
                    value: this.getLocalizedNumber(selectedColumnStats.numericalData.max) ?? locStrings.MissingData
                }
            );
            advancedStatsRows.push(
                {
                    label: locStrings.StatisticsKurtosis,
                    value:
                        this.getLocalizedNumber(selectedColumnStats.numericalData.kurtosis, decimalCount) ??
                        locStrings.MissingData
                },
                {
                    label: locStrings.StatisticsSkew,
                    value:
                        this.getLocalizedNumber(selectedColumnStats.numericalData.skew, decimalCount) ??
                        locStrings.MissingData
                }
            );
        }

        // categorical summary information
        const categoricalRows = [];
        if (selectedColumnStats?.categoricalData) {
            categoricalRows.push(
                {
                    label: locStrings.MostFrequentValue,
                    value: selectedColumnStats.categoricalData.top?.value ?? locStrings.MissingData
                },
                {
                    label: locStrings.MostFrequentValueFrequency,
                    value:
                        this.getLocalizedNumber(selectedColumnStats.categoricalData.top?.frequency) ??
                        locStrings.MissingData
                }
            );
        }

        const statisticsGroupContent = (
            <React.Fragment>{statsRows.map((r) => this.renderSummaryRow(r))}</React.Fragment>
        );
        const advancedStatisticsGroupContent = (
            <React.Fragment>{advancedStatsRows.map((r) => this.renderSummaryRow(r))}</React.Fragment>
        );
        const categoricalGroupContent = (
            <React.Fragment>{categoricalRows.map((r) => this.renderSummaryRow(r))}</React.Fragment>
        );

        return (
            <React.Fragment>
                {rows.map((r) => this.renderSummaryRow(r))}
                {(statsRows.length > 0 || advancedStatsRows.length > 0) &&
                    renderCustom({
                        props: {
                            groupContent: statisticsGroupContent,
                            advancedGroupContent: advancedStatisticsGroupContent
                        },
                        defaultRender: () => {
                            return statisticsGroupContent;
                        },
                        customRender: renderers?.onRenderStatisticsSubGroup
                    })}
                {categoricalRows.length > 0 &&
                    renderCustom({
                        props: {
                            groupContent: categoricalGroupContent
                        },
                        defaultRender: () => {
                            return categoricalGroupContent;
                        },
                        customRender: renderers?.onRenderCategoricalSubGroup
                    })}
            </React.Fragment>
        );
    }

    render() {
        const selectedColumnIndex = this.getSelectedColumnIndex();
        return (
            <div className="wrangler-summary">
                {selectedColumnIndex !== null
                    ? this.renderColumnStatistics(selectedColumnIndex)
                    : this.renderDataframeStatistics()}
            </div>
        );
    }
}
