import { OperationKey } from "@dw/orchestrator";
import { StripTextOperationBase, StripTextType } from "../../../core/operations/stripText";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.StripText]: extendBaseOperation(StripTextOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName, columnKeys, stripType } = ctx.baseProgram;
            const stripCommand =
                stripType === StripTextType.All ? "strip" : stripType === StripTextType.Leading ? "lstrip" : "rstrip";
            return {
                /**
                 * Example: strip leading and trailing spaces in 'Name' column
                 * ```
                 * df['Name'] = df['Name'].str.strip()
                 * ```
                 */
                getCode: () =>
                    columnKeys
                        .map((key) => {
                            return `${variableName}[${key}] = ${variableName}[${key}].str.${stripCommand}()`;
                        })
                        .join("\n")
            };
        }
    })
};
