import { ArgType, createArg, IColumnTarget } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { doesColumnNameExistInNonPreviewState } from "./util";

type ICloneOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    NewColumnName: string;
};
type ICloneBaseProgram = {
    variableName: string;
    columnKey: string;
    newColumnName: string;
};

/**
 * Base operation to clone columns.
 */
export const CloneOperationBase: () => IGenericOperation<
    ICloneOperationArgs,
    ICloneBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Schema,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0 || ctx.args.NewColumnName == "") {
            // if the column name is the same as the original value, just do nothing
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        } else if (doesColumnNameExistInNonPreviewState(ctx.dataframe, ctx.args.NewColumnName)) {
            // disallow duplicate column names
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    NewColumnName: ctx.formatString(
                        ctx.getLocalizedStrings(ctx.locale).ColumnExistsError,
                        `'${ctx.args.NewColumnName}'`
                    )
                }
            };
        }

        const selectedColumn = ctx.args.TargetColumns.value[0];

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKey: selectedColumn.key,
                    newColumnName: ctx.args.NewColumnName
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.getLocalizedStrings(locale).OperationCloneDescription,
                    `'${selectedColumn.name}'`,
                    `'${ctx.args.NewColumnName}'`
                ),
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
                    isSingleTarget: true,
                    allowUnknownType: true,
                    allowMixedType: true
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTarget
        ),
        createArg("NewColumnName", ArgType.String)
    ]
});
