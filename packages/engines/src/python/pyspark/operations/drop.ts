import { OperationKey } from "@dw/orchestrator";
import { DropOperationBase } from "../../../core/operations/drop";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.Drop]: extendBaseOperation(DropOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: drop the 'Survived' column
                 * ```
                 * df = df.drop('Survived')
                 * ```
                 */
                getCode: () => `${df} = ${df}.drop(${columnKeys.join(", ")})`
            };
        }
    })
};
