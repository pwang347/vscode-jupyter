import * as React from "react";
import { BarChart, Bar, Tooltip, YAxis, XAxis, ResponsiveContainer, TooltipProps } from "recharts";
import { CategoricalChartProps } from "recharts/types/chart/generateCategoricalChart";

import { IVisualizationRenderers, IVisualizationStyle } from "@dw/components";
import { formatString } from "@dw/messaging";

const CustomTooltip = (props: TooltipProps<string, string> & { visualizationStyle: IVisualizationStyle }) => {
    const { active, payload, label, visualizationStyle: style } = props;
    if (active && payload) {
        const cssStyle: React.CSSProperties = {
            padding: "4px",
            backgroundColor: style.backgroundColor,
            border: `1px solid ${style.foregroundColor}`,
            textAlign: "center",
            boxShadow: "2px 2px 4px 0px rgba(0,0,0,0.17)"
        };
        if (payload.length === 1) {
            return (
                <div style={cssStyle}>
                    <div>{label}</div>
                    <div style={{ color: payload[0].color }}>{`${payload[0].name}: ${payload[0].value}`}</div>
                </div>
            );
        } else if (payload.length > 1) {
            return (
                <div style={cssStyle}>
                    {payload.map((payloadItem, index) => (
                        <div
                            key={index}
                            style={{ color: payloadItem.color }}
                        >{`${payloadItem.name} : ${payloadItem.value}`}</div>
                    ))}
                </div>
            );
        }
    }

    return null;
};

function RechartsBase(props: CategoricalChartProps & { visualizationStyle: IVisualizationStyle }) {
    const { children, visualizationStyle: style, margin, ...otherProps } = props;
    return (
        <ResponsiveContainer height={60}>
            <BarChart
                margin={{
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                    ...margin
                }}
                // Since stacked bar charts don't respect the gap options and we normally use borders to mimic gaps,
                // in order to be consistent when borders are enabled we disable the gap everywhere.
                barCategoryGap={style.outlinesOnly ? 0 : 1}
                barGap={style.outlinesOnly ? 0 : 1}
                {...otherProps}
            >
                {children}
                <Tooltip
                    content={<CustomTooltip visualizationStyle={style} />}
                    cursor={{ fill: style.foregroundColor, opacity: 0.2 }}
                    labelStyle={{ color: style.foregroundColor }}
                    itemStyle={style.outlinesOnly ? { color: style.foregroundColor } : undefined}
                    allowEscapeViewBox={{ x: false, y: true }}
                    reverseDirection={{ y: true }}
                    wrapperStyle={{ zIndex: 10, outline: "none" }}
                    contentStyle={{
                        backgroundColor: style.backgroundColor,
                        border: `1px solid ${style.foregroundColor}`
                    }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

const renderers: IVisualizationRenderers = {
    onRenderBooleanVisualization: ({ visualization: vis, style, localizedStrings }) => (
        <RechartsBase
            data={[
                {
                    name: localizedStrings.CountLabel,
                    true: vis.trueCount,
                    false: vis.falseCount
                }
            ]}
            layout="vertical"
            margin={{ top: 20, bottom: 20 }}
            style={{
                stroke: style.outlinesOnly ? style.foregroundColor : style.backgroundColor,
                strokeWidth: style.outlinesOnly ? 1 : 2
            }}
            visualizationStyle={style}
        >
            <XAxis type={"number"} hide scale="linear" />
            <YAxis type={"category"} dataKey="name" hide />
            <Bar
                dataKey="false"
                label={localizedStrings.FalseCategoryLabel}
                stackId="a"
                fill={style.outlinesOnly ? "transparent" : style.secondaryColor}
                isAnimationActive={false}
            />
            <Bar
                dataKey="true"
                label={localizedStrings.TrueCategoryLabel}
                stackId="a"
                fill={style.outlinesOnly ? "transparent" : style.primaryColor}
                isAnimationActive={false}
            />
        </RechartsBase>
    ),
    onRenderNumericalVisualization: ({ visualization: vis, style, locale, localizedStrings }) => {
        const fmt = new Intl.NumberFormat(locale, {
            minimumFractionDigits: vis.binPrecision,
            maximumFractionDigits: vis.binPrecision
        });
        return (
            <RechartsBase
                data={vis.bins.map((bin) => ({
                    name:
                        bin.min === bin.max
                            ? fmt.format(bin.min)
                            : formatString(localizedStrings.RangeFormat, fmt.format(bin.min), fmt.format(bin.max)),
                    count: bin.count
                }))}
                style={
                    style.outlinesOnly
                        ? {
                              stroke: style.foregroundColor,
                              strokeWidth: 1
                          }
                        : undefined
                }
                visualizationStyle={style}
            >
                <XAxis type={"category"} dataKey="name" hide />
                <YAxis type={"number"} hide scale="linear" />
                <Bar
                    dataKey="count"
                    minPointSize={2}
                    name={localizedStrings.CountLabel}
                    fill={style.outlinesOnly ? "transparent" : style.primaryColor}
                    isAnimationActive={false}
                />
            </RechartsBase>
        );
    }
};

export default renderers;
