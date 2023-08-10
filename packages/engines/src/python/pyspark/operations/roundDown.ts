import { OperationKey } from "@dw/orchestrator";
import { RoundDownOperationBase } from "../../../core/operations/roundDown";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.RoundDown]: extendBaseOperation(RoundDownOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: round down values in the 'Foo' and 'Bar' columns
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Survived', F.floor(F.col('Survived')))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys.map((key) => `${df} = ${df}.withColumn(${key}, F.floor(F.col(${key})))`).join("\n")
                    ].join("\n")
            };
        }
    })
};
