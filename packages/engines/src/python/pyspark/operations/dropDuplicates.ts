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
                 * df = df.dropDuplicates()
                 * ```
                 */
                return {
                    getCode: () => `${df} = ${df}.dropDuplicates()`
                };
            }
            return {
                /**
                 * Example: drop duplicates in the 'Survived' column
                 * ```
                 * df = df.dropDuplicates(['Survived'])
                 * ```
                 */
                getCode: () => `${df} = ${df}.dropDuplicates([${columnKeys.join(", ")}])`
            };
        }
    })
};
