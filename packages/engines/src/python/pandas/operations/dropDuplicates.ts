import { OperationKey } from "@dw/orchestrator";
import { DropDuplicatesOperationBase } from "../../../core/operations/dropDuplicates";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.DropDuplicates]: extendBaseOperation(DropDuplicatesOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, targetingAllColumns } = ctx.baseProgram;
            if (targetingAllColumns) {
                /**
                 * Example: drop duplicates across all columns
                 * ```
                 * df = df.drop_duplicates()
                 * ```
                 */
                return {
                    getCode: () => `${df} = ${df}.drop_duplicates()`
                };
            }
            return {
                /**
                 * Example: drop duplicates in the 'Survived' column
                 * ```
                 * df = df.drop_duplicates(subset=['Survived'])
                 * ```
                 */
                getCode: () => `${df} = ${df}.drop_duplicates(subset=[${columnKeys.join(", ")}])`
            };
        }
    })
};
