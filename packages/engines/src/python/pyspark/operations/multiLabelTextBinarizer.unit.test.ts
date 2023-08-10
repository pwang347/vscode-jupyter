import { TranslationValidationResultType } from "@dw/messaging";
import Operations from "./multiLabelTextBinarizer";
import { assertOperationCode } from "./testUtil";

const operation = Operations.MultiLabelTextBinarizer;

describe("[PySpark] Column operation: Column operation: Multi-label text binarizer", () => {
    it("should handle happy path for 1 selected column with delimiter", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                delimiter: ";",
                prefix: ""
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "old_cols = df.columns",
                    "loc_0 = list(df.columns).index('Some_column')",
                    "new_cols = []",
                    "df = df.withColumn('Some_column_split', F.split(df['Some_column'], ';'))",
                    "labels_set = df.withColumn('Some_column_exploded', F.explode('Some_column_split')).agg(F.collect_set('Some_column_exploded')).collect()[0][0]",
                    "labels_set = sorted(labels_set)",
                    "for i in labels_set:",
                    "    curr = 'Some_column_%s' % i",
                    "    new_cols.append(curr)",
                    "    df = df.withColumn(curr, F.when(F.array_contains('Some_column_split', i), 1).otherwise(0))",
                    "df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("should handle happy path for 1 selected column with delimiter and prefix", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                delimiter: ";",
                prefix: "Foo"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "old_cols = df.columns",
                    "loc_0 = list(df.columns).index('Some_column')",
                    "new_cols = []",
                    "df = df.withColumn('Some_column_split', F.split(df['Some_column'], ';'))",
                    "labels_set = df.withColumn('Some_column_exploded', F.explode('Some_column_split')).agg(F.collect_set('Some_column_exploded')).collect()[0][0]",
                    "labels_set = sorted(labels_set)",
                    "for i in labels_set:",
                    "    curr = 'Foo_%s' % i",
                    "    new_cols.append(curr)",
                    "    df = df.withColumn(curr, F.when(F.array_contains('Some_column_split', i), 1).otherwise(0))",
                    "df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("should handle happy path for 1 selected column with delimiter with single quote in delimiter and column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columns: [
                    {
                        key: "'\\'Some_column\\''",
                        name: "'Some_column'",
                        index: 1
                    }
                ],
                delimiter: "';'",
                prefix: ""
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "old_cols = df.columns",
                    "loc_0 = list(df.columns).index('\\'Some_column\\'')",
                    "new_cols = []",
                    "df = df.withColumn('\\'Some_column\\'_split', F.split(df['\\'Some_column\\''], '\\';\\''))",
                    "labels_set = df.withColumn('\\'Some_column\\'_exploded', F.explode('\\'Some_column\\'_split')).agg(F.collect_set('\\'Some_column\\'_exploded')).collect()[0][0]",
                    "labels_set = sorted(labels_set)",
                    "for i in labels_set:",
                    "    curr = '\\'Some_column\\'_%s' % i",
                    "    new_cols.append(curr)",
                    "    df = df.withColumn(curr, F.when(F.array_contains('\\'Some_column\\'_split', i), 1).otherwise(0))",
                    "df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    },
                    {
                        key: "'Another_column'",
                        name: "Another_column",
                        index: 2
                    }
                ],
                delimiter: ";",
                prefix: ""
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "old_cols = df.columns",
                    "loc_0 = list(df.columns).index('Some_column')",
                    "new_cols = []",
                    "df = df.withColumn('Some_column_split', F.split(df['Some_column'], ';'))",
                    "labels_set = df.withColumn('Some_column_exploded', F.explode('Some_column_split')).agg(F.collect_set('Some_column_exploded')).collect()[0][0]",
                    "labels_set = sorted(labels_set)",
                    "for i in labels_set:",
                    "    curr = 'Some_column_%s' % i",
                    "    new_cols.append(curr)",
                    "    df = df.withColumn(curr, F.when(F.array_contains('Some_column_split', i), 1).otherwise(0))",
                    "df = df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])",
                    "old_cols = df.columns",
                    "loc_1 = list(df.columns).index('Another_column')",
                    "new_cols = []",
                    "df = df.withColumn('Another_column_split', F.split(df['Another_column'], ';'))",
                    "labels_set = df.withColumn('Another_column_exploded', F.explode('Another_column_split')).agg(F.collect_set('Another_column_exploded')).collect()[0][0]",
                    "labels_set = sorted(labels_set)",
                    "for i in labels_set:",
                    "    curr = 'Another_column_%s' % i",
                    "    new_cols.append(curr)",
                    "    df = df.withColumn(curr, F.when(F.array_contains('Another_column_split', i), 1).otherwise(0))",
                    "df = df.select(*old_cols[:loc_1], *new_cols, *old_cols[loc_1+1:])"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });
});
