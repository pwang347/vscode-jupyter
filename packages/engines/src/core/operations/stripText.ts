import { ArgType, ColumnType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

/**
 * Type of text strip.
 */
export enum StripTextType {
    Leading = "leading",
    Trailing = "trailing",
    All = "all"
}
type IStripTextOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    RemoveLeadingSpaces: boolean;
    RemoveTrailingSpaces: boolean;
};
type IStripTextBaseProgram = {
    variableName: string;
    columnKeys: string[];
    stripType: StripTextType;
};

/**
 * Base operation to strip whitespace from text columns.
 */
export const StripTextOperationBase: () => IGenericOperation<
    IStripTextOperationArgs,
    IStripTextBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Format,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const getTelemetryProperties = () => {
            return {
                properties: {
                    removeLeading: ctx.args.RemoveLeadingSpaces.toString(),
                    removeTrailing: ctx.args.RemoveTrailingSpaces.toString()
                },
                measurements: {
                    numTargets: ctx.args.TargetColumns.value.length
                }
            };
        };

        const stripType =
            ctx.args.RemoveLeadingSpaces && ctx.args.RemoveTrailingSpaces
                ? StripTextType.All
                : ctx.args.RemoveLeadingSpaces
                ? StripTextType.Leading
                : ctx.args.RemoveTrailingSpaces
                ? StripTextType.Trailing
                : undefined;
        if (!stripType) {
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    RemoveLeadingSpaces: ctx.getLocalizedStrings(ctx.locale).StripTextNothingRemovedError,
                    RemoveTrailingSpaces: ctx.getLocalizedStrings(ctx.locale).StripTextNothingRemovedError
                },
                getTelemetryProperties
            };
        }
        const columnKeys = ctx.args.TargetColumns.value.map((col) => col.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    stripType
                };
            },
            getDescription: (locale) => {
                let templateString;
                if (ctx.args.RemoveLeadingSpaces && ctx.args.RemoveTrailingSpaces) {
                    templateString =
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationStripTextDescription
                            : ctx.getLocalizedStrings(locale).OperationStripTextDescriptionPlural;
                } else if (ctx.args.RemoveLeadingSpaces) {
                    templateString =
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationStripTextDescriptionLeft
                            : ctx.getLocalizedStrings(locale).OperationStripTextDescriptionLeftPlural;
                } else {
                    templateString =
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationStripTextDescriptionRight
                            : ctx.getLocalizedStrings(locale).OperationStripTextDescriptionRightPlural;
                }
                return ctx.formatString(
                    templateString,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                );
            },
            getTelemetryProperties,
            previewStrategy: PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    // TODO@DW: do we need to support toggles for each column?
    getArgs: (ctx) => [
        createArg(
            "TargetColumns",
            ArgType.Target,
            {
                targetFilter: {
                    // TODO@DW: should the allowed types be based on the pandas types instead of the view types for more granularity?
                    allowedTypes: [ColumnType.String]
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg("RemoveLeadingSpaces", ArgType.Boolean, {
            default: true
        }),
        createArg("RemoveTrailingSpaces", ArgType.Boolean, {
            default: true
        })
    ]
});
