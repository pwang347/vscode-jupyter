import { OperationKey } from "@dw/orchestrator";
import { ConvertToCapitalCaseOperationBase } from "../../../core/operations/convertToCapitalCase";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.ConvertToCapitalCase]: extendBaseOperation(ConvertToCapitalCaseOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, capitalizeWords } = ctx.baseProgram;
            if (capitalizeWords) {
                /**
                 * Example: convert text to capital case in the 'Name' column
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Name', F.initcap(F.col('Name')))
                 * ```
                 */
                return {
                    getCode: () =>
                        [
                            "from pyspark.sql import functions as F",
                            columnKeys
                                .map((key) => `${df} = ${df}.withColumn(${key}, F.initcap(F.col(${key})))`)
                                .join("\n")
                        ].join("\n")
                };
            }

            return {
                /**
                 * Example: convert text to capital case in the 'Name' column
                 * ```
                 * from pyspark.sql import types as T
                 * from pyspark.sql import functions as F
                 * udf_capitalize = F.pandas_udf(lambda x: x.str.capitalize(), T.StringType())
                 * df = df.withColumn('Name', udf_capitalize('Name'))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import types as T",
                        "from pyspark.sql import functions as F",
                        "udf_capitalize = F.pandas_udf(lambda x: x.str.capitalize(), T.StringType())",
                        columnKeys.map((key) => `${df} = ${df}.withColumn(${key}, udf_capitalize(${key}))`).join("\n")
                    ].join("\n")
            };
        }
    })
};
