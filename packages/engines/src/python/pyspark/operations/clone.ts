import { OperationKey } from "@dw/orchestrator";
import { CloneOperationBase } from "../../../core/operations/clone";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";

export default {
    [OperationKey.Clone]: extendBaseOperation(CloneOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, newColumnName, columnKey } = ctx.baseProgram;
            const newName = escapeSingleQuote(newColumnName);
            return {
                /**
                 * Example: clone 'Foo' column to 'FooCopy'
                 * ```
                 * df = df.withColumn('FooCopy', df['Foo'])
                 * ```
                 */
                getCode: () => `${df} = ${df}.withColumn('${newName}', ${df}[${columnKey}])`
            };
        }
    })
};
