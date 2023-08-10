import { OperationKey } from "@dw/orchestrator";
import { OneHotEncodeOperationBase } from "../../../core/operations/oneHotEncode";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.OneHotEncode]: extendBaseOperation(OneHotEncodeOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, encodeMissingValues } = ctx.baseProgram;
            const dummyNaArg = encodeMissingValues ? ", dummy_na=True" : "";
            return {
                /**
                 * Example: one-hot encode the 'Embarked' column, including missing values
                 * ```
                 * import pandas as pd
                 * df = pd.get_dummies(df, columns=["Embarked"], dummy_na=True)
                 * ```
                 */
                getCode: () =>
                    [
                        "import pandas as pd",
                        `${df} = pd.get_dummies(${df}, columns=[${columnKeys.join(", ")}]${dummyNaArg})`
                    ].join("\n")
            };
        }
    })
};
