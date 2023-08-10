import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IMultiLabelTextBinarizerOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    Delimiter: string;
    Prefix: string;
};
type IMultiLabelTextBinarizerBaseProgram = {
    variableName: string;
    columns: IColumnTarget[];
    delimiter: string;
    prefix: string;
};

/**
 * Base operation to multi-hot encode text columns using a delimiter.
 */
export const MultiLabelTextBinarizerOperationBase: () => IGenericOperation<
    IMultiLabelTextBinarizerOperationArgs,
    IMultiLabelTextBinarizerBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Formulas,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        if (!ctx.args.Delimiter) {
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
                    delimiter: ctx.args.Delimiter,
                    prefix: ctx.args.Prefix
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationMultiLabelTextBinarizerDescription
                        : ctx.getLocalizedStrings(locale).OperationMultiLabelTextBinarizerDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                    `'${ctx.args.Delimiter}'`
                ),
            getTelemetryProperties: () => {
                return {
                    properties: {
                        hasPrefix: Boolean(ctx.args.Prefix).toString()
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
            undefined,
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("Delimiter", ArgType.String),
        createArg("Prefix", ArgType.String)
    ],
    defaultTargetFilter: {
        allowedTypes: [ColumnType.String, ColumnType.Category]
    }
});
