import { OperationKey } from "@dw/orchestrator";
import { StripTextOperationBase, StripTextType } from "../../../core/operations/stripText";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.StripText]: extendBaseOperation(StripTextOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, stripType } = ctx.baseProgram;
            const stripCommand =
                stripType === StripTextType.All ? "trim" : stripType === StripTextType.Leading ? "ltrim" : "rtrim";
            return {
                /**
                 * Example: strip leading and trailing spaces in 'Name' column
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Name', F.trim(df['Name']))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columnKeys
                            .map((key) => {
                                return `${df} = ${df}.withColumn(${key}, F.${stripCommand}(${df}[${key}]))`;
                            })
                            .join("\n")
                    ].join("\n")
            };
        }
    })
};
