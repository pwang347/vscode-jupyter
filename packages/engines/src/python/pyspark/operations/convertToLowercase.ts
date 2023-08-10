import { OperationKey } from "@dw/orchestrator";
import { ConvertToLowercaseOperationBase } from "../../../core/operations/convertToLowercase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToLowercase]: extendBaseOperation(ConvertToLowercaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: convert text to lowercase in the 'Survived' column
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Survived', F.lower(F.col('Survived')))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys.map((key) => `${df} = ${df}.withColumn(${key}, F.lower(F.col(${key})))`).join("\n")
                    ].join("\n")
            };
        }
    })
};
