import { OperationKey } from "@dw/orchestrator";
import { RoundDownOperationBase } from "../../../core/operations/roundDown";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundDown]: extendBaseOperation(RoundDownOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            const columnKeysAccessor = `[${columnKeys.join(", ")}]`;
            return {
                /**
                 * Example: round down values in the 'Foo' and 'Bar' columns
                 * ```
                 * import numpy as np
                 * df[['Foo', 'Bar']] = np.floor(df[['Foo', 'Bar']])
                 * ```
                 */
                getCode: () =>
                    [
                        "import numpy as np",
                        `${df}[${columnKeysAccessor}] = np.floor(${df}[${columnKeysAccessor}])`
                    ].join("\n")
            };
        }
    })
};
