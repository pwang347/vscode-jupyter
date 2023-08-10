import { ArgType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

type IDropOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
};
type IDropBaseProgram = {
    variableName: string;
    columnKeys: string[];
};

/**
 * Base operation to drop columns.
 */
export const DropOperationBase: () => IGenericOperation<
    IDropOperationArgs,
    IDropBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Schema,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const columnNames = ctx.args.TargetColumns.value.map((c) => c.name);
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
                        ? ctx.getLocalizedStrings(locale).OperationDropDescription
                        : ctx.getLocalizedStrings(locale).OperationDropDescriptionPlural,
                    formatColumnNamesInDescription(
                        columnNames.map((name) => `'${name}'`),
                        ctx.getLocalizedStrings(locale)
                    )
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
        allowUnknownType: true,
        allowMixedType: true
    }
});
