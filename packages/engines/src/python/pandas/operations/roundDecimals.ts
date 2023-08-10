import { OperationKey } from "@dw/orchestrator";
import { RoundDecimalsOperationBase } from "../../../core/operations/roundDecimals";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundDecimals]: extendBaseOperation(RoundDecimalsOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, decimals } = ctx.baseProgram;
            const methodArgs = columnKeys.map((key) => `${key}: ${decimals}`).join(", ");
            return {
                /**
                 * Example: round values in the 'Survived' column to 2 decimal places
                 * ```
                 * df = df.round({'Survived': 2})
                 * ```
                 */
                getCode: () => `${df} = ${df}.round({${methodArgs}})`
            };
        }
    })
};
