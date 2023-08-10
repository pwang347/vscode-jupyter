import { OperationKey } from "@dw/orchestrator";
import { MultiLabelTextBinarizerOperationBase } from "../../../core/operations/multiLabelTextBinarizer";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote, escapeTemplateString } from "../../../core/operations/util";
import { TranslationValidationResultType } from "@dw/messaging";

export default {
    [OperationKey.MultiLabelTextBinarizer]: extendBaseOperation(MultiLabelTextBinarizerOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columns, delimiter, prefix } = ctx.baseProgram;
            const delimiterEscaped = `'${escapeSingleQuote(delimiter)}'`;
            const multiLabelTextBinarizerStatements = columns
                .map((col, idx) => {
                    const key = col.key;
                    const colPrefix = `${escapeSingleQuote(col.name)}`;
                    const prefixValue = prefix
                        ? `'${escapeTemplateString(escapeSingleQuote(prefix))}_%s'`
                        : `'${escapeTemplateString(colPrefix)}_%s'`;
                    return [
                        `old_cols = ${df}.columns`,
                        `loc_${idx} = list(${df}.columns).index(${key})`,
                        "new_cols = []",
                        `${df} = ${df}.withColumn('${colPrefix}_split', F.split(${df}[${key}], ${delimiterEscaped}))`,
                        `labels_set = ${df}.withColumn('${colPrefix}_exploded', F.explode('${colPrefix}_split')).agg(F.collect_set('${colPrefix}_exploded')).collect()[0][0]`,
                        "labels_set = sorted(labels_set)",
                        "for i in labels_set:",
                        `    curr = ${prefixValue} % i`,
                        `    new_cols.append(curr)`,
                        `    ${df} = ${df}.withColumn(curr, F.when(F.array_contains('${colPrefix}_split', i), 1).otherwise(0))`,
                        `${df} = ${df}.select(*old_cols[:loc_${idx}], *new_cols, *old_cols[loc_${idx}+1:])`
                    ].join("\n");
                })
                .join("\n");

            return {
                /**
                 * Example: multi-label encode the 'Embarked' column using delimiter ';'
                 * ```
                 * from pyspark.sql import functions as F
                 * old_cols = df.columns
                 * loc_0 = list(df.columns).index('Embarked')
                 * new_cols = []
                 * df = df.withColumn('Embarked_split', F.split(df['Embarked'], ';'))
                 * labels_set = df.withColumn('Embarked_exploded', F.explode('Embarked_split')).agg(F.collect_set('Embarked_exploded')).collect()[0][0]
                 * labels_set = sorted(labels_set)
                 * for i in labels_set:
                 *     curr = 'Embarked_%s' % i
                 *     new_cols.append(curr)
                 *     df = df.withColumn(curr, F.when(F.array_contains('Embarked_split', i), 1).otherwise(0))
                 * df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])
                 * ```
                 */
                getCode: () => ["from pyspark.sql import functions as F", multiLabelTextBinarizerStatements].join("\n")
            };
        },
        validateBaseProgram: (ctx) => {
            const { getLocalizedStrings, formatString, originalEngineName } = ctx;
            return {
                type: TranslationValidationResultType.Warning,
                id: "pyspark-multi-label-binarizer",
                getMessage: (locale) =>
                    formatString(
                        getLocalizedStrings(locale).OperationCompatibilityPoorPerformanceWarning,
                        originalEngineName
                    )
            };
        }
    })
};
