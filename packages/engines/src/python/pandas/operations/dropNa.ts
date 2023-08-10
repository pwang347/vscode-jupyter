import { OperationKey } from "@dw/orchestrator";
import { DropNaOperationBase } from "../../../core/operations/dropNa";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.DropNa]: extendBaseOperation(DropNaOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, targetingAllColumns } = ctx.baseProgram;
            if (targetingAllColumns) {
                /**
                 * Example: drop rows with missing data across all columns
                 * ```
                 * df = df.dropna()
                 * ```
                 */
                return {
                    getCode: () => `${df} = ${df}.dropna()`
                };
            }
            return {
                /**
                 * Example: drop missing values in the 'Survived' column
                 * ```
                 * df = df.dropna(subset=['Survived'])
                 * ```
                 */
                getCode: () => `${df} = ${df}.dropna(subset=[${columnKeys.join(", ")}])`
            };
        }
    })
};
