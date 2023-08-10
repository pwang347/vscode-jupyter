import { OperationKey } from "@dw/orchestrator";
import { ConvertToUppercaseOperationBase } from "../../../core/operations/convertToUppercase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToUppercase]: extendBaseOperation(ConvertToUppercaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: convert text to uppercase in the 'Survived' column
                 * ```
                 * df['Survived'] = df['Survived'].str.upper()
                 * ```
                 */
                getCode: () => columnKeys.map((key) => `${df}[${key}] = ${df}[${key}].str.upper()`).join("\n")
            };
        }
    })
};
