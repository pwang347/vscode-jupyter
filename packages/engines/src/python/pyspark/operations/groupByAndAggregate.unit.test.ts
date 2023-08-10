import { TranslationValidationResultType } from "@dw/messaging";
import { AggregationType } from "../../../core/operations/groupByAndAggregate";
import Operations from "./groupByAndAggregate";
import { assertOperationCode } from "./testUtil";

const operation = Operations.GroupByAndAggregate;

describe("[PySpark] Column operation: Group by and aggregate", () => {
    it("[aggregation=count] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Count,
                        newColumnName: "Some_column_count"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.count('Some_column').alias('Some_column_count'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=first] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.First,
                        newColumnName: "Some_column_first"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.first('Some_column').alias('Some_column_first'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=last] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Last,
                        newColumnName: "Some_column_last"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.last('Some_column').alias('Some_column_last'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=countDistinct] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.countDistinct('Some_column').alias('Some_column_nunique'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=mode] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Mode,
                        newColumnName: "Some_column_mode"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_count_col = str(uuid.uuid4())",
                    "temp_row_col = str(uuid.uuid4())",
                    "window = Window.partitionBy('Some_column').orderBy(F.col(temp_count_col).desc())",
                    "df = df.groupBy('Some_column').agg(F.count('Some_column').alias(temp_count_col))",
                    "df = df.withColumn(temp_row_col, F.row_number().over(window)).where(F.col(temp_row_col) == 1)",
                    "df = df.select('Some_column')",
                    "df = df.withColumnRenamed('Some_column', 'Some_column_mode')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["This was generated to match the original pandas logic but may have performance issues."]
                }
            }
        );
    });

    it("[aggregation=mode] should handle happy path for 1 selected column and 2 aggregations", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Mode,
                        newColumnName: "Some_column_mode"
                    },
                    {
                        columnKey: "'Another_column'",
                        columnName: "Another_column",
                        aggregationType: AggregationType.Mode,
                        newColumnName: "Another_column_mode"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_count_col = str(uuid.uuid4())",
                    "temp_row_col = str(uuid.uuid4())",
                    "window = Window.partitionBy('Some_column').orderBy(F.col(temp_count_col).desc())",
                    "df_mode = df.groupBy('Some_column').agg(F.count('Some_column').alias(temp_count_col))",
                    "df_mode = df_mode.withColumn(temp_row_col, F.row_number().over(window)).where(F.col(temp_row_col) == 1)",
                    "df_mode = df_mode.select('Some_column')",
                    "df_mode = df_mode.withColumnRenamed('Some_column', 'Some_column_mode')",
                    "df_mode1 = df.groupBy('Some_column', 'Another_column').agg(F.count('Another_column').alias(temp_count_col))",
                    "df_mode1 = df_mode1.withColumn(temp_row_col, F.row_number().over(window)).where(F.col(temp_row_col) == 1)",
                    "df_mode1 = df_mode1.select('Some_column', 'Another_column')",
                    "df_mode1 = df_mode1.withColumnRenamed('Another_column', 'Another_column_mode')",
                    "df = df.groupBy('Some_column').count()",
                    "df = df.join(df_mode, ['Some_column'], 'left')",
                    "df = df.join(df_mode1, ['Some_column'], 'left')",
                    "df = df.select('Some_column','Some_column_mode','Another_column_mode')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["This was generated to match the original pandas logic but may have performance issues."]
                }
            }
        );
    });

    it("[aggregation=min] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.min('Some_column').alias('Some_column_min'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=max] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Max,
                        newColumnName: "Some_column_max"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.max('Some_column').alias('Some_column_max'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=idxmin] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMin,
                        newColumnName: "Some_column_idxmin"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_id = str(uuid.uuid4())",
                    "df_indexed = df.withColumn(temp_id, F.row_number().over(Window.orderBy(F.lit(1))) - 1)",
                    "df = df.groupBy('Some_column').agg(F.min('Some_column').alias('Some_column_minTemp'))",
                    "df = df.join(df_indexed.select('Some_column', temp_id, 'Some_column').withColumn('Some_column_minTemp', df_indexed['Some_column']), ['Some_column_minTemp', 'Some_column'], 'left')",
                    "df = df.withColumnRenamed(temp_id, 'Some_column_idxmin').drop('Some_column_minTemp')",
                    "df = df.sort(df['Some_column_idxmin'].asc())",
                    "df = df.dropDuplicates(subset=['Some_column'])",
                    "df = df.select('Some_column','Some_column_idxmin')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["This was generated to match the original pandas logic but may have performance issues."]
                }
            }
        );
    });

    it("[aggregation=idxmax] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMax,
                        newColumnName: "Some_column_idxmax"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_id = str(uuid.uuid4())",
                    "df_indexed = df.withColumn(temp_id, F.row_number().over(Window.orderBy(F.lit(1))) - 1)",
                    "df = df.groupBy('Some_column').agg(F.max('Some_column').alias('Some_column_maxTemp'))",
                    "df = df.join(df_indexed.select('Some_column', temp_id, 'Some_column').withColumn('Some_column_maxTemp', df_indexed['Some_column']), ['Some_column_maxTemp', 'Some_column'], 'left')",
                    "df = df.withColumnRenamed(temp_id, 'Some_column_idxmax').drop('Some_column_maxTemp')",
                    "df = df.sort(df['Some_column_idxmax'].asc())",
                    "df = df.dropDuplicates(subset=['Some_column'])",
                    "df = df.select('Some_column','Some_column_idxmax')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["This was generated to match the original pandas logic but may have performance issues."]
                }
            }
        );
    });

    it("[aggregation=all] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.All,
                        newColumnName: "Some_column_all"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.min('Some_column').alias('Some_column_all'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=any] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Any,
                        newColumnName: "Some_column_any"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.max('Some_column').alias('Some_column_any'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=sum] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Sum,
                        newColumnName: "Some_column_sum"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.sum('Some_column').alias('Some_column_sum'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=mean] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Mean,
                        newColumnName: "Some_column_mean"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.avg('Some_column').alias('Some_column_mean'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=std] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.StandardDeviation,
                        newColumnName: "Some_column_std"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.stddev('Some_column').alias('Some_column_std'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=var] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Variance,
                        newColumnName: "Some_column_var"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.variance('Some_column').alias('Some_column_var'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=sem] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.StandardErrorOfTheMean,
                        newColumnName: "Some_column_sem"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg((F.stddev('Some_column') / F.sqrt(F.count('Some_column'))).alias('Some_column_sem'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("[aggregation=skew] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Skew,
                        newColumnName: "Some_column_skew"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.skewness('Some_column').alias('Some_column_skew'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["Skewness is biased in PySpark and may yield slightly different results."]
                }
            }
        );
    });

    it("[aggregation=prod] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.ProductOfAllValues,
                        newColumnName: "Some_column_prod"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.product('Some_column').alias('Some_column_prod'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'\\'Some_column\\''"],
                aggregations: [
                    {
                        columnKey: "'\\'Some_column\\''",
                        columnName: "'Some_column'",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('\\'Some_column\\'').agg(F.min('\\'Some_column\\'').alias('Some_column_min'))",
                    "df = df.dropna()",
                    "df = df.sort(df['\\'Some_column\\''].asc())"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column and 2 aggregations", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column').agg(F.min('Some_column').alias('Some_column_min'), F.countDistinct('Some_column').alias('Some_column_nunique'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns and 2 aggregations", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'", "'Another_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.groupBy('Some_column', 'Another_column').agg(F.min('Some_column').alias('Some_column_min'), F.countDistinct('Some_column').alias('Some_column_nunique'))",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc(), df['Another_column'].asc())"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns and 2 aggregations with idxmin / idxmax", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'", "'Another_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMin,
                        newColumnName: "Some_column_idxmin"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMax,
                        newColumnName: "Some_column_idxmax"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_id = str(uuid.uuid4())",
                    "df_indexed = df.withColumn(temp_id, F.row_number().over(Window.orderBy(F.lit(1))) - 1)",
                    "df = df.groupBy('Some_column', 'Another_column').agg(F.min('Some_column').alias('Some_column_minTemp'), F.max('Some_column').alias('Some_column_maxTemp'))",
                    "df = df.join(df_indexed.select('Some_column', temp_id, 'Some_column', 'Another_column').withColumn('Some_column_minTemp', df_indexed['Some_column']), ['Some_column_minTemp', 'Some_column', 'Another_column'], 'left')",
                    "df = df.withColumnRenamed(temp_id, 'Some_column_idxmin').drop('Some_column_minTemp')",
                    "df = df.sort(df['Some_column_idxmin'].asc())",
                    "df = df.dropDuplicates(subset=['Some_column', 'Another_column'])",
                    "df = df.join(df_indexed.select('Some_column', temp_id, 'Some_column', 'Another_column').withColumn('Some_column_maxTemp', df_indexed['Some_column']), ['Some_column_maxTemp', 'Some_column', 'Another_column'], 'left')",
                    "df = df.withColumnRenamed(temp_id, 'Some_column_idxmax').drop('Some_column_maxTemp')",
                    "df = df.sort(df['Some_column_idxmax'].asc())",
                    "df = df.dropDuplicates(subset=['Some_column', 'Another_column'])",
                    "df = df.select('Some_column','Another_column','Some_column_idxmin','Some_column_idxmax')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc(), df['Another_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: ["This was generated to match the original pandas logic but may have performance issues."]
                }
            }
        );
    });

    it("should handle happy path for multiple warnings", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'", "'Another_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMin,
                        newColumnName: "Some_column_idxmin"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Skew,
                        newColumnName: "Some_column_skew"
                    }
                ]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_id = str(uuid.uuid4())",
                    "df_indexed = df.withColumn(temp_id, F.row_number().over(Window.orderBy(F.lit(1))) - 1)",
                    "df = df.groupBy('Some_column', 'Another_column').agg(F.min('Some_column').alias('Some_column_minTemp'), F.skewness('Some_column').alias('Some_column_skew'))",
                    "df = df.join(df_indexed.select('Some_column', temp_id, 'Some_column', 'Another_column').withColumn('Some_column_minTemp', df_indexed['Some_column']), ['Some_column_minTemp', 'Some_column', 'Another_column'], 'left')",
                    "df = df.withColumnRenamed(temp_id, 'Some_column_idxmin').drop('Some_column_minTemp')",
                    "df = df.sort(df['Some_column_idxmin'].asc())",
                    "df = df.dropDuplicates(subset=['Some_column', 'Another_column'])",
                    "df = df.select('Some_column','Another_column','Some_column_idxmin','Some_column_skew')",
                    "df = df.dropna()",
                    "df = df.sort(df['Some_column'].asc(), df['Another_column'].asc())"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.MultiWarning,
                    message: [
                        "Skewness is biased in PySpark and may yield slightly different results.",
                        "This was generated to match the original pandas logic but may have performance issues."
                    ]
                }
            }
        );
    });
});
