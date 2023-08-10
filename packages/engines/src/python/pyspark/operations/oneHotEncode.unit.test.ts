import { TranslationValidationResultType } from "@dw/messaging";
import Operations from "./oneHotEncode";
import { assertOperationCode } from "./testUtil";

const operation = Operations.OneHotEncode;

describe("[PySpark] Column operation: One-hot encode", () => {
    it("[encodeMissingValues=false] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: false
            },
            {
                code: [
                    "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                    "from pyspark.ml.functions import vector_to_array",
                    "from pyspark.sql import functions as F",
                    "",
                    "def one_hot_encode_col(df, key):",
                    "    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')",
                    "    indexer_fitted = indexer.fit(df)",
                    "    df_indexed = indexer_fitted.transform(df)",
                    "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                    "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                    "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                    "    labels = sorted(indexer_fitted.labels)",
                    "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                    "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                    "    df = df.drop(key)",
                    "    return df",
                    "",
                    "df = one_hot_encode_col(df, 'Some_column')"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("[encodeMissingValues=true] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: true
            },
            {
                code: [
                    "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                    "from pyspark.ml.functions import vector_to_array",
                    "from pyspark.sql import functions as F",
                    "",
                    "def one_hot_encode_col(df, key):",
                    "    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')",
                    "    indexer_fitted = indexer.fit(df)",
                    "    df_indexed = indexer_fitted.transform(df)",
                    "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                    "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                    "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                    "    labels = sorted(indexer_fitted.labels) + ['%s_nan' % str(key)]",
                    "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                    "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                    "    df = df.drop(key)",
                    "    return df",
                    "",
                    "df = one_hot_encode_col(df, 'Some_column')"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                encodeMissingValues: false
            },
            {
                code: [
                    "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                    "from pyspark.ml.functions import vector_to_array",
                    "from pyspark.sql import functions as F",
                    "",
                    "def one_hot_encode_col(df, key):",
                    "    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')",
                    "    indexer_fitted = indexer.fit(df)",
                    "    df_indexed = indexer_fitted.transform(df)",
                    "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                    "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                    "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                    "    labels = sorted(indexer_fitted.labels)",
                    "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                    "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                    "    df = df.drop(key)",
                    "    return df",
                    "",
                    "df = one_hot_encode_col(df, '\\'Some_column\\'')"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("[encodeMissingValues=false] should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                encodeMissingValues: false
            },
            {
                code: [
                    "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                    "from pyspark.ml.functions import vector_to_array",
                    "from pyspark.sql import functions as F",
                    "",
                    "def one_hot_encode_col(df, key):",
                    "    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')",
                    "    indexer_fitted = indexer.fit(df)",
                    "    df_indexed = indexer_fitted.transform(df)",
                    "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                    "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                    "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                    "    labels = sorted(indexer_fitted.labels)",
                    "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                    "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                    "    df = df.drop(key)",
                    "    return df",
                    "",
                    "df = one_hot_encode_col(df, 'Some_column')",
                    "df = one_hot_encode_col(df, 'Another_column')"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("[encodeMissingValues=true] should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                encodeMissingValues: true
            },
            {
                code: [
                    "from pyspark.ml.feature import StringIndexer, OneHotEncoder",
                    "from pyspark.ml.functions import vector_to_array",
                    "from pyspark.sql import functions as F",
                    "",
                    "def one_hot_encode_col(df, key):",
                    "    indexer = StringIndexer(inputCol=key, outputCol='%s_numeric' % str(key), handleInvalid='keep')",
                    "    indexer_fitted = indexer.fit(df)",
                    "    df_indexed = indexer_fitted.transform(df)",
                    "    encoder = OneHotEncoder(inputCols=['%s_numeric' % str(key)], outputCols=['%s_onehot' % str(key)], dropLast=False)",
                    "    df_onehot = encoder.fit(df_indexed).transform(df_indexed)",
                    "    df_col_onehot = df_onehot.select('*', vector_to_array('%s_onehot' % str(key)).alias('%s_col_onehot' % str(key)))",
                    "    labels = sorted(indexer_fitted.labels) + ['%s_nan' % str(key)]",
                    "    cols_expanded = [(F.col('%s_col_onehot' % str(key))[i].alias('%s_%s' % (str(key), labels[i]))) for i in range(len(labels))]",
                    "    df = df_col_onehot.select(*df.columns, *cols_expanded)",
                    "    df = df.drop(key)",
                    "    return df",
                    "",
                    "df = one_hot_encode_col(df, 'Some_column')",
                    "df = one_hot_encode_col(df, 'Another_column')"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });
});
