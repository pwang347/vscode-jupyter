import { OperationKey } from "@dw/orchestrator";
import { SplitTextOperationBase } from "../../../core/operations/splitText";
import { extendBaseOperation } from "../../../core/translate";
import { escapeRegExp, escapeSingleQuote, escapeTemplateString } from "../../../core/operations/util";

export default {
    [OperationKey.SplitText]: extendBaseOperation(SplitTextOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columns, useRegExp, delimiter } = ctx.baseProgram;
            const pattern = useRegExp ? delimiter : escapeRegExp(delimiter);
            return {
                /**
                 * Example: split text using string ' ' in 'Name' column
                 * ```
                 * from pyspark.sql import functions as F
                 * split_col = split(df['Name'], ' ')
                 * max_size = df.select(max(size(split_col))).collect()[0][0]
                 * old_cols = df.columns
                 * new_cols = []
                 * loc_0 = df.columns.index('Name')
                 * for i in range(max_size):
                 *     cur_col_name = "Name_%d" % i
                 *     new_cols.append(cur_col_name)
                 *     df = df.withColumn(cur_col_name, split_col.getItem(i))
                 * df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import functions as F",
                        columns
                            .map((col, idx) =>
                                [
                                    `split_col = F.split(${df}[${col.key}], '${escapeSingleQuote(pattern)}')`,
                                    `max_size = ${df}.select(F.max(F.size(split_col))).collect()[0][0]`,
                                    `old_cols = ${df}.columns`,
                                    "new_cols = []",
                                    `loc_${idx} = ${df}.columns.index(${col.key})`,
                                    "for i in range(max_size):",
                                    `    cur_col_name = '${escapeSingleQuote(escapeTemplateString(col.name))}_%d' % i`,
                                    "    new_cols.append(cur_col_name)",
                                    `    ${df} = ${df}.withColumn(cur_col_name, split_col.getItem(i))`,
                                    `${df} = ${df}.select(*old_cols[:loc_${idx}], *new_cols, *old_cols[loc_${idx}+1:])`
                                ].join("\n")
                            )
                            .join("\n")
                    ].join("\n")
            };
        }
    })
};
