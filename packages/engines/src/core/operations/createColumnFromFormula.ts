import { ArgType, createArg, getTargetableColumnNames, getUniqueColumnName } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation,
    OperationCategory
} from "@dw/orchestrator";

type ICreateColumnFromFormulaOperationArgs = {
    ColumnName: string;
    Formula: string;
};
type ICreateColumnFromFormulaOperationConfig = {
    hasLambda: (text: string) => boolean;
    examples: string[];
};
type ICreateColumnFromFormulaBaseProgram = {
    variableName: string;
    columnName: string;
    columnFormula: string;
    isExistingColumn: boolean;
};

/**
 * Base operation to create a column from a formula.
 */
export const CreateColumnFromFormulaOperationBase: (
    config: ICreateColumnFromFormulaOperationConfig
) => IGenericOperation<
    ICreateColumnFromFormulaOperationArgs,
    ICreateColumnFromFormulaBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = (config) => ({
    isTranslationSupported: false,
    category: OperationCategory.Formulas,
    generateBaseProgram: (ctx) => {
        // Return incomplete if no formula provided
        if (!ctx.args.Formula) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const allColumnNames = getTargetableColumnNames(ctx.dataframe, false);
        const columnName = ctx.args.ColumnName ? ctx.args.ColumnName : getUniqueColumnName("newCol", allColumnNames);
        const formula = ctx.args.Formula;
        const isExistingColumn = allColumnNames.includes(columnName);

        return {
            getBaseProgram: () => ({
                variableName: ctx.variableName,
                columnFormula: formula,
                columnName,
                isExistingColumn
            }),
            getDescription: (locale) =>
                ctx.formatString(
                    isExistingColumn
                        ? ctx.getLocalizedStrings(locale).OperationCreateColumnFromFormulaModifyDescription
                        : ctx.getLocalizedStrings(locale).OperationCreateColumnFromFormulaDescription,
                    `'${columnName}'`
                ),
            getTelemetryProperties: () => {
                return {
                    properties: {
                        isReplace: Boolean(isExistingColumn).toString(),
                        hasLambda: config.hasLambda(formula).toString()
                    },
                    measurements: {
                        formulaLen: formula.length
                    }
                };
            },
            previewStrategy: isExistingColumn ? PreviewStrategy.ModifiedColumns : PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: () => [
        createArg("ColumnName", ArgType.String),
        createArg("Formula", ArgType.Formula, {
            examples: config.examples
        })
    ]
});
