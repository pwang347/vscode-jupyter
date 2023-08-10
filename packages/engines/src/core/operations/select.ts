import { ArgType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type ISelectOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
};
type ISelectBaseProgram = {
    variableName: string;
    columnKeys: string[];
};

/**
 * Base operation to select columns.
 */
export const SelectOperationBase: () => IGenericOperation<
    ISelectOperationArgs,
    ISelectBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Schema,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        // TODO@DW: once we support more generic preview diffs, we should allow for re-ordering during the select
        const selectedColumnsSorted = ctx.args.TargetColumns.value.sort(
            (columnA, columnB) => columnA.index - columnB.index
        );
        const columnKeys = selectedColumnsSorted.map((c) => c.key);

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
                        ? ctx.getLocalizedStrings(locale).OperationSelectDescription
                        : ctx.getLocalizedStrings(locale).OperationSelectDescriptionPlural,
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
                    allowUnknownType: true,
                    allowMixedType: true
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        )
    ]
});
