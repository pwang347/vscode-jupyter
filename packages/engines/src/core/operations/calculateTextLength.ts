import {
    ArgType,
    ColumnType,
    createArg,
    getTargetableColumnNames,
    getUniqueColumnName,
    IColumnTarget
} from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { doesColumnNameExistInNonPreviewState, escapeSingleQuote } from "./util";

type ICalculateTextLengthOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    NewColumnName: string;
};
type ICalculateTextLengthBaseProgram = {
    variableName: string;
    columnKey: string;
    newColumnInsertIndex: number;
    newColumnName: string;
};

/**
 * Base operation to calculate the length of text columns.
 */
export const CalculateTextLengthOperationBase: () => IGenericOperation<
    ICalculateTextLengthOperationArgs,
    ICalculateTextLengthBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.Formulas,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const getTelemetryProperties = () => ({
            properties: {
                hasNewColumnName: Boolean(ctx.args.NewColumnName).toString()
            }
        });

        const columnNames = getTargetableColumnNames(ctx.dataframe);
        const primarySelectedColumn = ctx.args.TargetColumns.value[ctx.args.TargetColumns.value.length - 1];
        const name = ctx.args.NewColumnName
            ? ctx.args.NewColumnName
            : getUniqueColumnName(`${primarySelectedColumn.name}_len`, columnNames);

        // disallow duplicate names
        if (doesColumnNameExistInNonPreviewState(ctx.dataframe, name)) {
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    NewColumnName: ctx.formatString(
                        ctx.getLocalizedStrings(ctx.locale).ColumnExistsError,
                        `'${escapeSingleQuote(ctx.args.NewColumnName)}'`
                    )
                },
                getTelemetryProperties
            };
        }

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKey: primarySelectedColumn.key,
                    newColumnInsertIndex: primarySelectedColumn.index,
                    newColumnName: name
                };
            },
            getDescription: (locale: string) =>
                ctx.formatString(
                    ctx.getLocalizedStrings(locale).OperationCalculateTextLengthDescription,
                    primarySelectedColumn.key
                ),
            getTelemetryProperties,
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
        createArg("NewColumnName", ArgType.String)
    ],
    defaultTargetFilter: {
        allowedTypes: [ColumnType.String],
        isSingleTarget: true
    }
});
