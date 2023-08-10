import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IConvertToCapitalCaseOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    CapitalizeWords: boolean;
};
type IConvertToCapitalCaseBaseProgram = {
    variableName: string;
    columnKeys: string[];
    capitalizeWords: boolean;
};

/**
 * Base operation to convert text columns to capital case.
 */
export const ConvertToCapitalCaseOperationBase: () => IGenericOperation<
    IConvertToCapitalCaseOperationArgs,
    IConvertToCapitalCaseBaseProgram,
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
                    columnKeys,
                    capitalizeWords: ctx.args.CapitalizeWords
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationConvertToCapitalCaseDescription
                        : ctx.getLocalizedStrings(locale).OperationConvertToCapitalCaseDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                ),
            getTelemetryProperties: () => {
                return {
                    properties: {
                        capitalizeWords: ctx.args.CapitalizeWords.toString()
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
            undefined,
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("CapitalizeWords", ArgType.Boolean)
    ],
    defaultTargetFilter: {
        allowedTypes: [ColumnType.String]
    }
});
