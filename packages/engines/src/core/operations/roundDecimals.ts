import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IRoundDecimalsOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    Decimals: number;
};
type IRoundDecimalsBaseProgram = {
    variableName: string;
    columnKeys: string[];
    decimals: number;
};

/**
 * Base operation to round columns to specified decimal place.
 */
export const RoundDecimalsOperationBase: () => IGenericOperation<
    IRoundDecimalsOperationArgs,
    IRoundDecimalsBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Numeric,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const decimals = ctx.args.Decimals.toString();
        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    decimals: ctx.args.Decimals
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationRoundDecimalsDescription
                        : ctx.getLocalizedStrings(locale).OperationRoundDecimalsDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                    decimals
                ),
            getTelemetryProperties: () => {
                return {
                    measurements: {
                        decimals: ctx.args.Decimals,
                        numTargets: ctx.args.TargetColumns.value.length
                    }
                };
            },
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
        createArg("Decimals", ArgType.Integer, { default: 0 })
    ]
});
