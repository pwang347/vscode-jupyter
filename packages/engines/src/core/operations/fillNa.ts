import { ArgType, createArg, IColumnTarget, ColumnType, IOperationArgView, IArgLayoutHint } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation,
    IDataWranglerOperationArgContext
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

/**
 * Method to fill missing values.
 */
export enum FillMethod {
    Mean = "mean",
    Median = "median",
    Mode = "mode",
    Bfill = "bfill",
    Ffill = "ffill",
    Custom = "custom"
}

type IFillNaOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
        subMenu: {
            Typed: {
                SelectFillMethod: {
                    value: FillMethod;
                    subMenu: {
                        Value?: any;
                    };
                };
            };
        };
    };
};
type IFillNaBaseProgram = {
    variableName: string;
    columnKeys: string[];
    type: ColumnType;
    fill: {
        method: FillMethod;
        parameter?: any;
    };
};

/**
 * Base operation to fill missing values in columns.
 */
export const FillNaOperationBase: () => IGenericOperation<
    IFillNaOperationArgs,
    IFillNaBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.FindAndReplace,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        // allowMixedType is false by default, so the type of the first column is accurate
        const type = ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index]?.type;
        const rawType = ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index]?.rawType;
        const isNumeric = [ColumnType.Float, ColumnType.Integer].includes(type);

        const methodArg = ctx.args.TargetColumns.subMenu.Typed.SelectFillMethod;
        const fillMethod = methodArg.value;

        const getTelemetryProperties = () => {
            return {
                properties: {
                    fillMethod,
                    rawType: ctx.redactCustomRawType(rawType)
                },
                measurements: {
                    numTargets: ctx.args.TargetColumns.value.length
                }
            };
        };

        const isCustom = fillMethod === FillMethod.Custom;
        const replacementValue =
            methodArg?.subMenu.Value !== undefined ? ctx.stringifyValue(methodArg.subMenu.Value, type) : undefined;
        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    type,
                    fill: {
                        method: fillMethod,
                        parameter: methodArg?.subMenu.Value
                    }
                };
            },
            getDescription: (locale) => {
                const locStrings = ctx.getLocalizedStrings(locale);
                const fillMethodLocalizations: Omit<Record<FillMethod, string>, "custom"> = {
                    mean: locStrings.OperationFillNaDescriptionMean,
                    median: locStrings.OperationFillNaDescriptionMedian,
                    mode: isNumeric
                        ? locStrings.OperationFillNaDescriptionMode
                        : locStrings.OperationFillNaDescriptionModeNonNumeric,
                    bfill: locStrings.OperationFillNaMethodDescriptionBfill,
                    ffill: locStrings.OperationFillNaMethodDescriptionFfill
                };

                const valueOrMethod = replacementValue ? replacementValue : fillMethod;

                if (isCustom) {
                    return ctx.formatString(
                        ctx.args.TargetColumns.value.length === 1
                            ? locStrings.OperationFillNaDescription
                            : locStrings.OperationFillNaDescriptionPlural,
                        formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                        valueOrMethod
                    );
                } else {
                    return ctx.formatString(
                        fillMethodLocalizations[fillMethod],
                        formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                    );
                }
            },
            getTelemetryProperties,
            previewStrategy: PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx: IDataWranglerOperationArgContext<typeof LocalizedStrings.Orchestrator>) => {
        const locStrings = ctx.getLocalizedStrings(ctx.locale);
        const numericValue = createArg("Value", ArgType.VariableColumnType);

        const rawGenericMethods = {
            choices: [
                {
                    key: FillMethod.Mode,
                    label: locStrings.OperationFillNaArgsMethodModeNonNumeric
                },
                // ffill is more commonly used than bfill, so it's listed first
                {
                    key: FillMethod.Ffill,
                    label: locStrings.OperationFillNaArgsMethodFfill
                },
                {
                    key: FillMethod.Bfill,
                    label: locStrings.OperationFillNaArgsMethodBfill
                },
                {
                    key: FillMethod.Custom,
                    label: locStrings.OperationFillNaArgsCustom
                }
            ],
            default: "custom",
            subMenuByChoice: {
                mode: [],
                custom: [numericValue]
            },
            layoutHint: IArgLayoutHint.InlineGrow
        };
        const genericMethods = createArg(
            "SelectFillMethod",
            ArgType.Category,
            rawGenericMethods,
            locStrings.OperationFillNaArgsFillMethod
        );
        const numericMethods = createArg(
            "SelectFillMethod",
            ArgType.Category,
            {
                ...rawGenericMethods,
                choices: [
                    {
                        key: FillMethod.Mean,
                        label: locStrings.OperationFillNaArgsMethodMean
                    },
                    {
                        key: FillMethod.Median,
                        label: locStrings.OperationFillNaArgsMethodMedian
                    },
                    {
                        key: FillMethod.Mode,
                        label: locStrings.OperationFillNaArgsMethodMode
                    },
                    ...rawGenericMethods.choices.slice(1) // skipping mode
                ],
                subMenuByChoice: {
                    mean: [],
                    median: [],
                    ...rawGenericMethods.subMenuByChoice
                }
            },
            locStrings.OperationFillNaArgsFillMethod
        );

        const typedArgs: { [key in ColumnType]: IOperationArgView[] } = {
            boolean: [genericMethods],
            category: [genericMethods],
            datetime: [genericMethods],
            float: [numericMethods],
            integer: [numericMethods],
            string: [genericMethods],
            timedelta: [genericMethods],
            complex: [genericMethods],
            period: [genericMethods],
            interval: [genericMethods],
            unknown: [genericMethods]
        };
        return [
            createArg(
                "TargetColumns",
                ArgType.Target,
                {
                    subMenu: [createArg("Typed", ArgType.TypeDependent, typedArgs)]
                },
                ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
            )
        ];
    },
    defaultTargetFilter: {
        requiresSameType: true
    }
});
