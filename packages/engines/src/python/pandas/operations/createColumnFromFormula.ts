import { OperationKey } from "@dw/orchestrator";
import { CreateColumnFromFormulaOperationBase } from "../../../core/operations/createColumnFromFormula";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "./util";
import { codeHasLambda } from "../../util";

export default {
    [OperationKey.CreateColumnFromFormula]: extendBaseOperation(CreateColumnFromFormulaOperationBase, {
        config: {
            hasLambda: codeHasLambda,
            examples: ["'foo'", "df.apply(lambda row: row[0] + row[1], axis=1)", "df['name'].str.upper()"]
        },
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnName, columnFormula } = ctx.baseProgram;
            const columnNameEscaped = escapeSingleQuote(columnName);
            return {
                /**
                 * Example: Created new column 'Foo' using custom formula
                 * ```
                 * df['Foo'] = df['Name'].apply(lambda x: x[:2], axis=1)
                 * ```
                 */
                getCode: () => `${df}['${columnNameEscaped}'] = ${columnFormula}`
            };
        }
    })
};
