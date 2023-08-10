import { OperationKey } from "@dw/orchestrator";
import { ConvertToLowercaseOperationBase } from "../../../core/operations/convertToLowercase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToLowercase]: extendBaseOperation(ConvertToLowercaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: convert text to lowercase in the 'Survived' column
                 * ```
                 * df['Survived'] = df['Survived'].str.lower()
                 * ```
                 */
                getCode: () => columnKeys.map((key) => `${df}[${key}] = ${df}[${key}].str.lower()`).join("\n")
            };
        }
    })
};
