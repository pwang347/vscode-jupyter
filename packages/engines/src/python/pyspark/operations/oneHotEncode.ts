import { OperationKey } from "@dw/orchestrator";
import { OneHotEncodeOperationBase } from "../../../core/operations/oneHotEncode";
import { extendBaseOperation } from "../../../core/translate";
import { TranslationValidationResultType } from "@dw/messaging";

export default {
    [OperationKey.OneHotEncode]: extendBaseOperation(OneHotEncodeOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, encodeMissingValues } = ctx.baseProgram;
            return {
                /**
                 * Example: one-hot encode the 'Embarked' column, including missing values
                 * ```
                 * from pyspark.ml.feature import StringIndexer, OneHotEncoder
                 * from pyspark.ml.functions import vector_to_array
                 * from pyspark.sql.functions import col
                 *
                 * def one_hot_encode_col(df, key):
                 *     indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')
                 *     indexer_fitted = indexer.fit(df)
                 *     df_indexed = indexer_fitted.transform(df)
                 *     encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)
                 *     df_onehot = encoder.fit(df_indexed).transform(df_indexed)
                 *     df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))
                 *     labels = sorted(indexer_fitted.labels) + ['%s_nan' % str(key)]
                 *     cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]
                 *     df = df_col_onehot.select(*df.columns, *cols_expanded)
                 *     df = df.drop(key)
                 *     return df
                 *
                 * df = one_hot_encode_col(df, 'Embarked')
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                        "from pyspark.ml.functions import vector_to_array",
                        "from pyspark.sql import functions as F",
                        "",
                        "def one_hot_encode_col(df, key):",
                        `    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')`,
                        "    indexer_fitted = indexer.fit(df)",
                        "    df_indexed = indexer_fitted.transform(df)",
                        "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                        "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                        "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                        `    labels = sorted(indexer_fitted.labels)${
                            encodeMissingValues ? ` + ['%s_nan' % str(key)]` : ""
                        }`,
                        "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                        "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                        "    df = df.drop(key)",
                        "    return df",
                        "",
                        columnKeys.map((key) => `${df} = one_hot_encode_col(${df}, ${key})`).join("\n")
                    ].join("\n")
            };
        },
        validateBaseProgram: (ctx) => {
            const { getLocalizedStrings, formatString, originalEngineName } = ctx;
            return {
                type: TranslationValidationResultType.Warning,
                id: "pyspark-one-hot-encode",
                getMessage: (locale) =>
                    formatString(
                        getLocalizedStrings(locale).OperationCompatibilityPoorPerformanceWarning,
                        originalEngineName
                    )
            };
        }
    })
};
