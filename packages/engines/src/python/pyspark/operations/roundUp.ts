import { OperationKey } from "@dw/orchestrator";
import { RoundUpOperationBase } from "../../../core/operations/roundUp";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundUp]: extendBaseOperation(RoundUpOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: round up values in the 'Foo' and 'Bar' columns
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Survived', F.ceil(F.col('Survived')))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys.map((key) => `${df} = ${df}.withColumn(${key}, F.ceil(F.col(${key})))`).join("\n")
                    ].join("\n")
            };
        }
    })
};
