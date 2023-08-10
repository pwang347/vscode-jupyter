import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IRoundUpOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
};
type IRoundUpBaseProgram = {
    variableName: string;
    columnKeys: string[];
};

/**
 * Base operation to round up numeric columns.
 */
export const RoundUpOperationBase: () => IGenericOperation<
    IRoundUpOperationArgs,
    IRoundUpBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Numeric,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationRoundUpDescription
                        : ctx.getLocalizedStrings(locale).OperationRoundUpDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                ),
            getTelemetryProperties: () => {
                return {
                    measurements: {
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
        )
    ]
});
