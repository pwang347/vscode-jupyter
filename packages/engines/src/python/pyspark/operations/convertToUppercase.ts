import { OperationKey } from "@dw/orchestrator";
import { ConvertToUppercaseOperationBase } from "../../../core/operations/convertToUppercase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToUppercase]: extendBaseOperation(ConvertToUppercaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys } = ctx.baseProgram;
            return {
                /**
                 * Example: convert text to uppercase in the 'Survived' column
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Survived', F.upper(F.col('Survived')))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys.map((key) => `${df} = ${df}.withColumn(${key}, F.upper(F.col(${key})))`).join("\n")
                    ].join("\n")
            };
        }
    })
};
