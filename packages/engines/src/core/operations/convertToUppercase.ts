import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IConvertToUppercaseOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
};
type IConvertToUppercaseBaseProgram = {
    variableName: string;
    columnKeys: string[];
};

/**
 * Base operation to convert text columns to lowercase.
 */
export const ConvertToUppercaseOperationBase: () => IGenericOperation<
    IConvertToUppercaseOperationArgs,
    IConvertToUppercaseBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Format,
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
                        ? ctx.getLocalizedStrings(locale).OperationConvertToUppercaseDescription
                        : ctx.getLocalizedStrings(locale).OperationConvertToUppercaseDescriptionPlural,
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
            undefined,
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        )
    ],
    defaultTargetFilter: {
        allowedTypes: [ColumnType.String]
    }
});
