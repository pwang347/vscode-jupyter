import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type ISplitTextOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    RegularExpression: boolean;
    Delimiter: string;
};
type ISplitTextBaseProgram = {
    variableName: string;
    columns: IColumnTarget[];
    useRegExp: boolean;
    delimiter: string;
};

/**
 * Base operation to split text in columns.
 */
export const SplitTextOperationBase: () => IGenericOperation<
    ISplitTextOperationArgs,
    ISplitTextBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Format,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0 || ctx.args.Delimiter.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columns: ctx.args.TargetColumns.value,
                    useRegExp: ctx.args.RegularExpression,
                    delimiter: ctx.args.Delimiter
                };
            },
            getDescription: (locale) => {
                let templateString;
                if (ctx.args.RegularExpression) {
                    templateString =
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationSplitTextDescriptionRegex
                            : ctx.getLocalizedStrings(locale).OperationSplitTextDescriptionRegexPlural;
                } else {
                    templateString =
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationSplitTextDescriptionString
                            : ctx.getLocalizedStrings(locale).OperationSplitTextDescriptionStringPlural;
                }
                return ctx.formatString(
                    templateString,
                    ctx.args.Delimiter,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                );
            },
            getTelemetryProperties: () => {
                return {
                    properties: {
                        isRegularExpression: ctx.args.RegularExpression.toString()
                    },
                    measurements: {
                        numTargets: ctx.args.TargetColumns.value.length,
                        delimiterLen: ctx.args.Delimiter.length
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
                    // TODO@DW: should the allowed types be based on the pandas types instead of the view types for more granularity?
                    allowedTypes: [ColumnType.String, ColumnType.Category]
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("Delimiter", ArgType.String),
        createArg("RegularExpression", ArgType.Boolean)
    ]
});
