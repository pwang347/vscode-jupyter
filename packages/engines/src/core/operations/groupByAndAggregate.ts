import { ArgType, ColumnType, createArg, IColumnTarget, IOperationArgView } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation,
    IDataWranglerOperationArgContext
} from "@dw/orchestrator";
import { formatColumnNamesInDescription, sanitizeColumnNames } from "./util";

/**
 * Available aggregations.
 */
export enum AggregationType {
    Count = "count",
    First = "first",
    Last = "last",
    CountDistinct = "nunique",
    Mode = "mode",
    Min = "min",
    Max = "max",
    IndexMin = "idxmin",
    IndexMax = "idxmax",
    All = "all",
    Any = "any",
    Sum = "sum",
    Mean = "mean",
    StandardDeviation = "std",
    Variance = "var",
    StandardErrorOfTheMean = "sem",
    Skew = "skew",
    ProductOfAllValues = "prod"
}

type IGroupByAndAggregateOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    // TODO@DW: consider using non-uppercase payload keys
    Aggregations: {
        // TODO@DW: in the future we can make this syntax nicer by removing the `children` property
        // and making the arg itself an array
        children: Array<{
            TargetColumns: {
                value: IColumnTarget[];
                subMenu: {
                    Aggregation: {
                        AggregationType: {
                            value: AggregationType;
                        };
                    };
                };
            };
        }>;
    };
};
type IGroupByAndAggregateBaseProgram = {
    variableName: string;
    groupByKeys: string[];
    aggregations: Array<{
        columnKey: string;
        columnName: string;
        aggregationType: AggregationType;
        newColumnName: string;
    }>;
};

/**
 * Base operation to group by and aggregate columns.
 */
export const GroupByAndAggregateOperationBase: () => IGenericOperation<
    IGroupByAndAggregateOperationArgs,
    IGroupByAndAggregateBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    generateBaseProgram: (ctx) => {
        if (
            ctx.args.TargetColumns.value.length === 0 ||
            ctx.args.Aggregations.children.some((aggregation) => aggregation.TargetColumns.value.length === 0) ||
            ctx.args.Aggregations.children.length === 0 // require at least one aggregation
        ) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const groupByKeys = ctx.args.TargetColumns.value.map((c) => c.key);
        const baseNames = ctx.args.Aggregations.children.map(
            (a) => `${a.TargetColumns.value[0].name}_${a.TargetColumns.subMenu.Aggregation.AggregationType.value}`
        );
        const sanitizedNames = sanitizeColumnNames(...baseNames);
        const aggregations = ctx.args.Aggregations.children.map((a, i) => ({
            columnKey: a.TargetColumns.value[0].key,
            columnName: a.TargetColumns.value[0].name,
            aggregationType: a.TargetColumns.subMenu.Aggregation.AggregationType.value,
            newColumnName: sanitizedNames[i]
        }));

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    groupByKeys,
                    aggregations
                };
            },
            getDescription: (locale) => {
                const aggregationString = ctx.formatString(
                    aggregations.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationGroupByAndAggregateDescriptionAggregation
                        : ctx.formatString(
                              ctx.getLocalizedStrings(locale).OperationGroupByAndAggregateDescriptionAggregationPlural,
                              aggregations.length
                          )
                );
                return ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationGroupByAndAggregateDescription
                        : ctx.getLocalizedStrings(locale).OperationGroupByAndAggregateDescriptionPlural,
                    aggregationString,
                    formatColumnNamesInDescription(groupByKeys, ctx.getLocalizedStrings(locale))
                );
            },
            getTelemetryProperties: () => {
                const uniqueAggregationMethods = new Set(
                    ctx.args.Aggregations.children.map(
                        (agg) => agg.TargetColumns.subMenu.Aggregation.AggregationType.value
                    )
                );
                return {
                    properties: {
                        uniqueAggregationTypes: Array.from(uniqueAggregationMethods).join(",")
                    },
                    measurements: {
                        numGroupedColumns: ctx.args.TargetColumns.value.length,
                        numAggregations: ctx.args.Aggregations.children.length
                    }
                };
            },
            targetedColumns: ctx.args.TargetColumns.value,
            previewStrategy: PreviewStrategy.SideBySide,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx) => [
        createArg(
            "TargetColumns",
            ArgType.Target,
            {
                targetFilter: {
                    allowUnknownType: true,
                    allowMixedType: true
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgTarget
        ),
        createArg("Aggregations", ArgType.ArgGroup, {
            args: [
                createArg(
                    "TargetColumns",
                    ArgType.Target,
                    {
                        targetFilter: {
                            allowUnknownType: true,
                            allowMixedType: true,
                            isSingleTarget: true
                        },
                        subMenu: [createArg("Aggregation", ArgType.TypeDependent, getAggregationArgs(ctx))]
                    },
                    ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTarget
                )
            ],
            addGroupLabel: ctx.getLocalizedStrings(ctx.locale)
                .OperationGroupByAndAggregateArgsAggregationsAddAggregation
        })
    ]
});

function getAggregationCategoryArg(
    choices: Array<{ key: string; label: string }>,
    ctx: IDataWranglerOperationArgContext
) {
    return createArg(
        "AggregationType",
        ArgType.Category,
        {
            choices
        },
        ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationType
    );
}

function getAggregationArgsByType(type: ColumnType, ctx: IDataWranglerOperationArgContext): IOperationArgView[] {
    // these aggregations apply to all data types
    const baseOptions = [
        {
            key: AggregationType.Count,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeCount
        },
        {
            key: AggregationType.First,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeFirstValue
        },
        {
            key: AggregationType.Last,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeLastValue
        },
        {
            key: AggregationType.CountDistinct,
            label: ctx.getLocalizedStrings(ctx.locale)
                .OperationGroupByAndAggregateArgsAggregationTypeNumberOfUniqueValues
        },
        {
            key: AggregationType.Mode,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeMode
        }
    ];
    const orderableDataOptions = [
        {
            key: AggregationType.Min,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeMinimum
        },
        {
            key: AggregationType.Max,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeMaximum
        },
        {
            key: AggregationType.IndexMin,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeIndexOfMinimum
        },
        {
            key: AggregationType.IndexMax,
            label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeIndexOfMaximum
        }
    ];
    if (type === ColumnType.Boolean) {
        return [
            getAggregationCategoryArg(
                [
                    ...baseOptions,
                    {
                        key: AggregationType.All,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeBooleanAll
                    },
                    {
                        key: AggregationType.Any,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeBooleanAny
                    }
                ],
                ctx
            )
        ];
    }
    if (type === ColumnType.Datetime) {
        return [getAggregationCategoryArg([...baseOptions, ...orderableDataOptions], ctx)];
    }
    if (type === ColumnType.Float || type === ColumnType.Integer) {
        return [
            getAggregationCategoryArg(
                [
                    ...baseOptions,
                    {
                        key: AggregationType.Sum,
                        label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeSum
                    },
                    {
                        key: AggregationType.Mean,
                        label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeMean
                    },
                    ...orderableDataOptions,
                    {
                        key: AggregationType.StandardDeviation,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeStandardDeviation
                    },
                    {
                        key: AggregationType.Variance,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeVariance
                    },
                    {
                        key: AggregationType.StandardErrorOfTheMean,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeStandardErrorOfTheMean
                    },
                    {
                        key: AggregationType.Skew,
                        label: ctx.getLocalizedStrings(ctx.locale).OperationGroupByAndAggregateArgsAggregationTypeSkew
                    },
                    {
                        key: AggregationType.ProductOfAllValues,
                        label: ctx.getLocalizedStrings(ctx.locale)
                            .OperationGroupByAndAggregateArgsAggregationTypeProductOfAllValues
                    }
                ],
                ctx
            )
        ];
    }

    return [getAggregationCategoryArg(baseOptions, ctx)];
}

function getAggregationArgs(ctx: IDataWranglerOperationArgContext): { [key in ColumnType]: IOperationArgView[] } {
    const resultSoFar: { [key in ColumnType]?: IOperationArgView[] } = {};
    for (const key of Object.values(ColumnType)) {
        resultSoFar[key] = getAggregationArgsByType(key, ctx);
    }
    return resultSoFar as { [key in ColumnType]: IOperationArgView[] };
}
