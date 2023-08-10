import { OperationKey } from "@dw/orchestrator";
import { RoundUpOperationBase } from "../../../core/operations/roundUp";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundUp]: extendBaseOperation(RoundUpOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            const columnKeysAccessor = `[${columnKeys.join(", ")}]`;
            return {
                /**
                 * Example: round up values in the 'Foo' and 'Bar' columns
                 * ```
                 * import numpy as np
                 * df[['Foo', 'Bar']] = np.ceil(df[['Foo', 'Bar']])
                 * ```
                 */
                getCode: () =>
                    ["import numpy as np", `${df}[${columnKeysAccessor}] = np.ceil(${df}[${columnKeysAccessor}])`].join(
                        "\n"
                    )
            };
        }
    })
};
