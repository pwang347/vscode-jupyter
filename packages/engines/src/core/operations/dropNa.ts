import { ArgType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription, isTargetingAllColumns } from "./util";

type IDropNaOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
};
type IDropNaBaseProgram = {
    variableName: string;
    columnKeys: string[];
    targetingAllColumns: boolean;
};

/**
 * Base operation to drop rows with missing values in columns.
 */
export const DropNaOperationBase: () => IGenericOperation<
    IDropNaOperationArgs,
    IDropNaBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.FindAndReplace,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        // TODO@DW: add flag to disable this optimization
        const targetingAllColumns = isTargetingAllColumns(ctx.dataframe, ctx.args.TargetColumns.value);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    targetingAllColumns
                };
            },
            getDescription: (locale) =>
                targetingAllColumns
                    ? ctx.getLocalizedStrings(locale).OperationDropNaAllColumnsDescription
                    : ctx.formatString(
                          ctx.args.TargetColumns.value.length === 1
                              ? ctx.getLocalizedStrings(locale).OperationDropNaDescription
                              : ctx.getLocalizedStrings(locale).OperationDropNaDescriptionPlural,
                          formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale))
                      ),
            getTelemetryProperties: () => {
                return {
                    measurements: {
                        numTargets: ctx.args.TargetColumns.value.length
                    }
                };
            },
            previewStrategy: PreviewStrategy.AddedOrRemovedRows,
            result: OperationCodeGenResultType.Success,
            customColumnAnnotations: (column) => {
                if (ctx.args.TargetColumns.value.find((col) => col.key === column.key)) {
                    return {
                        ...column.annotations,
                        isTargeted: true
                    };
                }
                return column.annotations;
            }
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
        allowUnknownType: true,
        allowMixedType: true
    }
});
