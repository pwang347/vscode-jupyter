import { OperationKey } from "@dw/orchestrator";
import { CalculateTextLengthOperationBase } from "../../../core/operations/calculateTextLength";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";

export default {
    [OperationKey.CalculateTextLength]: extendBaseOperation(CalculateTextLengthOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKey, newColumnName, newColumnInsertIndex: idx } = ctx.baseProgram;
            const newName = escapeSingleQuote(newColumnName);
            return {
                /**
                 * Example: calculate text length for the 'Name' column
                 * ```
                 * df.insert(1, "Name_len", df["Name"].str.len())
                 * ```
                 */
                getCode: () => `${df}.insert(${idx}, '${newName}', ${df}[${columnKey}].str.len())`
            };
        }
    })
};
