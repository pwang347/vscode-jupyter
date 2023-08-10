import { OperationKey } from "@dw/orchestrator";
import { ConvertToCapitalCaseOperationBase } from "../../../core/operations/convertToCapitalCase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToCapitalCase]: extendBaseOperation(ConvertToCapitalCaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, capitalizeWords } = ctx.baseProgram;
            const command = capitalizeWords ? "title" : "capitalize";
            return {
                /**
                 * Example: capitalize text in the 'Name' column
                 * ```
                 * df['Name'] = df['Name'].str.capitalize()
                 * ```
                 */
                getCode: () => columnKeys.map((key) => `${df}[${key}] = ${df}[${key}].str.${command}()`).join("\n")
            };
        }
    })
};
