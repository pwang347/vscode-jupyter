import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IScaleOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    NewMinimum: number;
    NewMaximum: number;
};
type IScaleBaseProgram = {
    variableName: string;
    columnKeys: string[];
    newMinimum: number;
    newMaximum: number;
};

/**
 * Base operation to scale numeric columns between a min and max value.
 */
export const ScaleOperationBase: () => IGenericOperation<
    IScaleOperationArgs,
    IScaleBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Numeric,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const getTelemetryProperties = () => {
            return {
                measurements: {
                    minValue: ctx.args.NewMinimum,
                    maxValue: ctx.args.NewMaximum,
                    numTargets: ctx.args.TargetColumns.value.length
                }
            };
        };

        // if min >= max, we should show an error in the input field
        if (ctx.args.NewMinimum >= ctx.args.NewMaximum) {
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    NewMinimum: ctx.getLocalizedStrings(ctx.locale).ScaleColumnMinMaxError
                },
                getTelemetryProperties
            };
        }

        const minValue = ctx.args.NewMinimum.toString();
        const maxValue = ctx.args.NewMaximum.toString();
        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    newMinimum: ctx.args.NewMinimum,
                    newMaximum: ctx.args.NewMaximum
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationScaleDescription
                        : ctx.getLocalizedStrings(locale).OperationScaleDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                    minValue,
                    maxValue
                ),
            getTelemetryProperties,
            previewStrategy: PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx) => [
        createArg(
            "TargetColumns",
            ArgType.Target,
            {
                targetFilter: {
                    allowedTypes: [ColumnType.Float, ColumnType.Integer]
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("NewMinimum", ArgType.Float, { default: 0.0 }),
        createArg("NewMaximum", ArgType.Float, { default: 1.0 })
    ]
});
