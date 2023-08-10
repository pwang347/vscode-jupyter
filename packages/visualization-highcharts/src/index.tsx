import * as React from "react";
import Highcharts from "highcharts";
import HighchartsAccessibility from "highcharts/modules/accessibility";
import HighchartsReactTypes, { HighchartsReact } from "highcharts-react-official";

import { IVisualizationRenderers, IVisualizationStyle, LocalizedStrings } from "@dw/components";
import { formatString } from "@dw/messaging";

// Enable accessibility module in Highcharts
HighchartsAccessibility(Highcharts);

/**
 * Highcharts uses a dot notation for interpolating context keys into localized strings.
 * To simplify the strings for the localization team, we use simpler "{0}" style placeholders
 * and then format those to be the correct syntax Highcharts needs.
 */
function formatHighchartsStrings(locStrings: typeof LocalizedStrings.Visualization): Highcharts.LangOptions {
    return {
        accessibility: {
            axis: {
                xAxisDescriptionSingular: formatString(
                    locStrings.HighchartsXAxisAriaDescription,
                    "{names[0]}",
                    "{ranges[0]}"
                ),
                yAxisDescriptionSingular: formatString(
                    locStrings.HighchartsYAxisAriaDescription,
                    "{names[0]}",
                    "{ranges[0]}"
                ),
                rangeFromTo: formatString(locStrings.HighchartsDataRangeFromToAriaLabel, "{rangeFrom}", "{rangeTo}")
            },
            chartContainerLabel: formatString(locStrings.HighchartsContainerWithTitleAriaLabel, "{title}"),
            chartTypes: {
                columnSingle: `{#eq numPoints 1}${
                    locStrings.HighchartsSingleColumnSingularAriaLabel
                }{else}${formatString(locStrings.HighchartsSingleColumnPluralAriaLabel, "{numPoints}")}{/eq}`,
                barMultiple: formatString(locStrings.HighchartsMultipleBarPluralAriaLabel, "{numPoints}")
            },
            defaultChartTitle: "", // This overrides the default "Chart". Charts should provide a title below.
            // graphicContainerLabel: "", // Used, but empty by default so no need to localize.
            screenReaderSection: {
                // afterRegionLabel: "", // Used, but empty by default so no need to localize.
                // beforeRegionLabel: "", // Used, but empty by default so no need to localize.
                endOfChartMarker: locStrings.HighchartsEndAriaLabel
            },
            series: {
                summary: {
                    bar: `{#eq series.points.length 1}${formatString(
                        locStrings.HighchartsBarSeriesSummarySingularAriaLabel,
                        "{series.name}",
                        "{seriesNumber}",
                        "{chart.series.length}"
                    )}{else}${formatString(
                        locStrings.HighchartsBarSeriesSummaryPluralAriaLabel,
                        "{series.name}",
                        "{seriesNumber}",
                        "{chart.series.length}",
                        "{series.points.length}"
                    )}{/eq}`
                }
            },
            svgContainerLabel: locStrings.HighchartsContainerAriaLabel
            // svgContainerTitle: "" // Used, but empty by default so no need to localize.
        }
    };
}

function HighchartsBase(
    props: Highcharts.Options & {
        memoKeys: unknown[];
        locale: string;
        visualizationStyle: IVisualizationStyle;
        locStrings: typeof LocalizedStrings.Visualization;
        enableFocus: boolean;
    }
) {
    const { locale, locStrings, visualizationStyle: style, enableFocus, memoKeys, ...otherProps } = props;
    const borderWidth = style.outlinesOnly ? 1 : 2;
    const options = React.useMemo(
        () =>
            Highcharts.merge<Highcharts.Options>(
                {
                    accessibility: {
                        keyboardNavigation: {
                            focusBorder: {
                                margin: 1
                            },
                            // Don't wrap around when using the arrow keys to navigate the chart.
                            // This helps prevent the user from being trapped inside the chart.
                            wrapAround: false
                        }
                        // These are used, but currently the same as the defaults and don't need localization.
                        // Defaults can be found here: https://api.highcharts.com/highcharts/accessibility
                        // point: {
                        //     valueDescriptionFormat: "{xDescription}{separator}{value}."
                        // },
                        // screenReaderSection: {
                        //     beforeChartFormat:
                        //         "<{headingTagName}>{chartTitle}</{headingTagName}><div>{typeDescription}</div><div>{chartSubtitle}</div><div>{chartLongdesc}</div><div>{playAsSoundButton}</div><div>{viewTableButton}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div><div>{annotationsTitle}{annotationsList}</div>",
                        //     afterChartFormat: "{endOfChartMarker}"
                        // },
                        // series: {
                        //     descriptionFormat: "{seriesDescription}{authorDescription}{axisDescription}"
                        // }
                    },
                    lang: formatHighchartsStrings(locStrings),
                    chart: {
                        animation: false,
                        spacing: [0, 0, 0, 0], // No added spacing around the chart
                        height: 60, // Chart height is always 60px
                        margin: [2, 1, borderWidth * 2 + 1, 1], // Needed to show borders and to prevent focus border from scrolling the chart
                        backgroundColor: "none", // No background behind chart
                        numberFormatter: (number, decimals) => {
                            const fmt = new Intl.NumberFormat(
                                locale,
                                decimals < 0
                                    ? undefined
                                    : {
                                          minimumFractionDigits: decimals,
                                          maximumFractionDigits: decimals
                                      }
                            );
                            return fmt.format(number);
                        }
                    },
                    plotOptions: {
                        series: {
                            borderColor: style.outlinesOnly ? style.foregroundColor : style.backgroundColor,
                            clip: false, // Prevent borders on the edges from being clipped
                            states: style.outlinesOnly ? { hover: { color: style.foregroundColor } } : {},
                            animation: false // Disable animation
                        },
                        column: {
                            groupPadding: 0, // Minimal padding between bars
                            pointPadding: 0, // ^
                            minPointLength: borderWidth + 2, // Minimum 2px height for small / zero-value data points
                            borderWidth, // Highcharts doesn't support pixel-based spacing between bars, so we use a border instead
                            borderRadius: 0 // No rounded corners
                        },
                        bar: {
                            groupPadding: 0,
                            pointPadding: 0.3,
                            minPointLength: borderWidth + 2, // Minimum 2px height for small / zero-value data points
                            borderWidth,
                            borderRadius: 0 // No rounded corners
                        }
                    },
                    title: {
                        style: { display: "none" } // Don't display the chart title. It is only used for a11y.
                    },
                    navigation: {
                        buttonOptions: {
                            enabled: false // No navigation button
                        }
                    },
                    credits: {
                        enabled: false // No "highcharts.com" credits
                    },
                    legend: {
                        enabled: false // No series legend
                    },
                    tooltip: {
                        distance: 8, // Tooltip should float a bit above the chart to not overlap with the borders
                        animation: false, // Disable animation
                        outside: true, // Allow tooltip to overflow the chart area
                        shared: true, // Show tooltip anywhere in the chart
                        hideDelay: 100 // Hide the tooltip shortly after the mouse leaves
                    },
                    xAxis: {
                        visible: false, // Hide x-axis
                        maxPadding: 0.0, // No padding,
                        endOnTick: false // Make sure there is never additional padding
                    },
                    yAxis: {
                        visible: false, // Hide y-axis
                        maxPadding: 0.0, // No padding,
                        endOnTick: false // Make sure there is never additional padding
                    }
                },
                otherProps
            ),
        [locale, locStrings, style, ...memoKeys]
    );

    const chartRef = React.useRef<HighchartsReactTypes.RefObject>(null);
    React.useEffect(() => {
        if (chartRef.current) {
            // See https://github.com/highcharts/highcharts/issues/19374
            // Highcharts seems to assume that accessibility doesn't need to update unless the chart is re-rendered.
            // But this assumption breaks when enabling / disabling keyboard navigation.
            // So we manually update the options here, and then call updateA11yEnabled() to force an update.
            // We also prevent the chart from updating when the options change (below) since this seems to trigger the issue as well.
            chartRef.current.chart.update({
                accessibility: {
                    keyboardNavigation: {
                        enabled: enableFocus
                    }
                }
            });
            (chartRef.current.chart as any).updateA11yEnabled();
        }
    }, [enableFocus]);

    return <HighchartsReact allowChartUpdate={false} ref={chartRef} highcharts={Highcharts} options={options} />;
}

const renderers: IVisualizationRenderers = {
    onRenderBooleanVisualization: ({ visualization: vis, style, locale, localizedStrings, enableFocus }) => (
        <HighchartsBase
            title={{
                text: localizedStrings.HighchartsBooleanVisAriaLabel
            }}
            xAxis={{
                type: "category",
                accessibility: {
                    description: localizedStrings.HighchartsBooleanXAxisAriaLabel
                }
            }}
            yAxis={{
                accessibility: {
                    description: localizedStrings.HighchartsBooleanYAxisAriaLabel
                }
            }}
            series={[
                {
                    name: localizedStrings.FalseCategoryLabel,
                    data: [
                        {
                            name: localizedStrings.CountLabel,
                            y: vis.falseCount,
                            color: style.outlinesOnly ? style.backgroundColor : style.secondaryColor
                        }
                    ],
                    type: "bar",
                    stacking: "percent"
                },
                {
                    name: localizedStrings.TrueCategoryLabel,
                    data: [
                        {
                            name: localizedStrings.CountLabel,
                            y: vis.trueCount,
                            color: style.outlinesOnly ? style.backgroundColor : style.primaryColor
                        }
                    ],
                    type: "bar",
                    stacking: "percent"
                }
            ]}
            memoKeys={[vis]}
            visualizationStyle={style}
            locale={locale}
            locStrings={localizedStrings}
            enableFocus={enableFocus}
            key="bool"
        />
    ),
    onRenderNumericalVisualization: ({ visualization: vis, style, locale, localizedStrings, enableFocus }) => {
        const fmt = new Intl.NumberFormat(locale, {
            minimumFractionDigits: vis.binPrecision,
            maximumFractionDigits: vis.binPrecision
        });
        return (
            <HighchartsBase
                title={{
                    text: localizedStrings.HighchartsNumericVisAriaLabel
                }}
                xAxis={{
                    type: "linear",
                    accessibility: {
                        description: localizedStrings.HighchartsNumericXAxisAriaLabel
                    }
                }}
                yAxis={{
                    accessibility: {
                        description: localizedStrings.HighchartsNumericYAxisAriaLabel
                    }
                }}
                series={[
                    {
                        name: localizedStrings.CountLabel,
                        data: vis.bins.map((bin) => ({
                            name:
                                bin.min === bin.max
                                    ? fmt.format(bin.min)
                                    : formatString(
                                          localizedStrings.RangeFormat,
                                          fmt.format(bin.min),
                                          fmt.format(bin.max)
                                      ),
                            y: bin.count,
                            x: bin.min
                        })),
                        type: "column",
                        color: style.outlinesOnly ? style.backgroundColor : style.primaryColor
                    }
                ]}
                memoKeys={[vis]}
                visualizationStyle={style}
                locale={locale}
                locStrings={localizedStrings}
                enableFocus={enableFocus}
                key="numeric"
            />
        );
    }
};

export default renderers;
