import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IOneHotEncodeOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    EncodeMissingValues: boolean;
};
type IOneHotEncodeBaseProgram = {
    variableName: string;
    columnKeys: string[];
    encodeMissingValues: boolean;
};

/**
 * Base operation to one-hot encode columns.
 */
export const OneHotEncodeOperationBase: () => IGenericOperation<
    IOneHotEncodeOperationArgs,
    IOneHotEncodeBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Formulas,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const columnKeys = ctx.args.TargetColumns.value.map((col) => col.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    encodeMissingValues: ctx.args.EncodeMissingValues
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationOneHotEncodeDescription
                        : ctx.getLocalizedStrings(locale).OperationOneHotEncodeDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                ),
            getTelemetryProperties: () => {
                return {
                    properties: {
                        encodesMissingValues: Boolean(ctx.args.EncodeMissingValues).toString()
                    },
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
                    allowedTypes: [ColumnType.String, ColumnType.Category]
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("EncodeMissingValues", ArgType.Boolean)
    ]
});
