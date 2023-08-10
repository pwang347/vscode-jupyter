import { OperationKey } from "@dw/orchestrator";
import { escapeSingleQuote } from "../../../core/operations/util";
import { CalculateTextLengthOperationBase } from "../../../core/operations/calculateTextLength";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.CalculateTextLength]: extendBaseOperation(CalculateTextLengthOperationBase, {
        translateBaseProgram: (ctx) => {
            const {
                variableName: df,
                columnKey: textColumnKey,
                newColumnInsertIndex: idx,
                newColumnName
            } = ctx.baseProgram;
            const newName = escapeSingleQuote(newColumnName);
            return {
                /**
                 * Example: calculate text length for the 'Name' column
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.withColumn("Name_len", F.length("Name"))
                 * df = df.select(*df.columns[:1], "Name_len", *df.columns[1:])
                 * ```
                 */
                getCode: () =>
                    [
                        `from pyspark.sql import functions as F`,
                        `${df} = ${df}.withColumn('${newName}', F.length(${textColumnKey}))`,
                        `${df} = ${df}.select(*${df}.columns[:${idx}], '${newName}', *${df}.columns[${idx}:])`
                    ].join("\n")
            };
        }
    })
};
