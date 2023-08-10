import { OperationKey } from "@dw/orchestrator";
import { SelectOperationBase } from "../../../core/operations/select";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.Select]: extendBaseOperation(SelectOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: select the 'Survived' column
                 * ```
                 * df = df.loc[:, ['Survived']]
                 * ```
                 */
                getCode: () => `${df} = ${df}.loc[:, [${columnKeys.join(", ")}]]`
            };
        }
    })
};
