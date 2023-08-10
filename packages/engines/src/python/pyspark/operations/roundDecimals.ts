import { OperationKey } from "@dw/orchestrator";
import { RoundDecimalsOperationBase } from "../../../core/operations/roundDecimals";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundDecimals]: extendBaseOperation(RoundDecimalsOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, decimals } = ctx.baseProgram;
            return {
                /**
                 * Example: round values in the 'Survived' column to 2 decimal places
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Survived', F.round(F.col('Survived'), 2))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys
                            .map((key) => `${df} = ${df}.withColumn(${key}, F.round(F.col(${key}), ${decimals}))`)
                            .join("\n")
                    ].join("\n")
            };
        }
    })
};
