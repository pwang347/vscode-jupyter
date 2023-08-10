import { OperationKey } from "@dw/orchestrator";
import { CreateColumnFromFormulaOperationBase } from "../../../core/operations/createColumnFromFormula";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";
import { codeHasLambda } from "../../util";

export default {
    [OperationKey.CreateColumnFromFormula]: extendBaseOperation(CreateColumnFromFormulaOperationBase, {
        config: {
            hasLambda: codeHasLambda,
            examples: ["df['name']", "lit(1)"]
        },
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnName, columnFormula } = ctx.baseProgram;
            const columnNameEscaped = escapeSingleQuote(columnName);
            return {
                /**
                 * Example: Created new column 'Foo' using custom formula
                 * ```
                 * df = df.withColumn('Foo', df['Name'])
                 * ```
                 */
                getCode: () => `${df} = ${df}.withColumn('${columnNameEscaped}', ${columnFormula})`
            };
        }
    })
};
