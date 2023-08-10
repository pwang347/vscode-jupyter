import Operations from "./variable";
import { assertDataImportOperationCode } from "../testUtil";
import { DataFrameTypeIdentifier, PySparkDataFrameConversionMethod } from "@dw/orchestrator";

const operation = Operations.Variable;

describe("[Pandas] Data import operation: Variable", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.Pandas,
                variableName: "df"
            },
            {
                runtimeCode: ""
            }
        );
    });

    it("should handle happy path with truncated rows", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.Pandas,
                variableName: "df",
                truncationRows: 10
            },
            {
                runtimeCode: ["if len(df) > 10:", "    df = df.head(10)", "    print('{\"truncated\": true}')"].join(
                    "\n"
                ),
                displayCode: ""
            }
        );
    });

    it("should handle happy path with PySpark variable: LimitAndConvert", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df"
            },
            {
                runtimeCode: ["pandas_df = df.toPandas()"].join("\n"),
                displayCode: "pandas_df = df.toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: LimitAndConvert", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "pandas_df = df.limit(10).toPandas()",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable: TakeAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct
            },
            {
                runtimeCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                ),
                displayCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                )
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: TakeAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.take(10), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.take(10), columns=df.columns)"].join(
                    "\n"
                )
            }
        );
    });

    it("should handle happy path with PySpark variable: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(1)).collect(), columns=df.columns)"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(1)).collect(), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated fraction: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction,
                truncationFraction: 0.5
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5)).collect(), columns=df.columns)",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5)).collect(), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(1)).take(10), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(1)).take(10), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction and seed: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction,
                truncationFraction: 0.5,
                seed: 2
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5), seed=2).collect(), columns=df.columns)",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5), seed=2).collect(), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction and truncated rows: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction,
                truncationFraction: 0.5,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5)).take(10), columns=df.columns)",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5)).take(10), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction, seed and truncated rows: RandomTakeAndConstructByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction,
                truncationFraction: 0.5,
                truncationRows: 10,
                seed: 2
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5), seed=2).take(10), columns=df.columns)",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(fraction=float(0.5), seed=2).take(10), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction
            },
            {
                runtimeCode: ["pandas_df = df.sample(fraction=float(1)).toPandas()"].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(1)).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated fraction: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction,
                truncationFraction: 0.5
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(fraction=float(0.5)).toPandas()",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(0.5)).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(fraction=float(1)).limit(10).toPandas()",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(1)).limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction and seed: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction,
                truncationFraction: 0.5,
                seed: 2
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(fraction=float(0.5), seed=2).toPandas()",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(0.5), seed=2).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction and truncated rows: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction,
                truncationFraction: 0.5,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(fraction=float(0.5)).limit(10).toPandas()",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(0.5)).limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated fraction, seed and truncated rows: RandomLimitAndConvertByFraction", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction,
                truncationFraction: 0.5,
                truncationRows: 10,
                seed: 2
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(fraction=float(0.5), seed=2).limit(10).toPandas()",
                    "if 0.5 < 1:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(fraction=float(0.5), seed=2).limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable: RandomTakeAndConstructByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByCount
            },
            {
                runtimeCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                ),
                displayCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                )
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: RandomTakeAndConstructByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByCount,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(1.0*10/df.count()).take(10), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(1.0*10/df.count()).take(10), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated rows and seed: RandomTakeAndConstructByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomTakeAndConstructByCount,
                truncationRows: 10,
                seed: 2
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(1.0*10/df.count(), seed=2).take(10), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.sample(1.0*10/df.count(), seed=2).take(10), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable: RandomLimitAndConvertByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByCount
            },
            {
                runtimeCode: ["pandas_df = df.toPandas()"].join("\n"),
                displayCode: "pandas_df = df.toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: RandomLimitAndConvertByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByCount,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(1.0*10/df.count()).limit(10).toPandas()",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(1.0*10/df.count()).limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable, truncated rows and seed: RandomLimitAndConvertByCount", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RandomLimitAndConvertByCount,
                truncationRows: 10,
                seed: 2
            },
            {
                runtimeCode: [
                    "pandas_df = df.sample(1.0*10/df.count(), seed=2).limit(10).toPandas()",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: "pandas_df = df.sample(1.0*10/df.count(), seed=2).limit(10).toPandas()"
            }
        );
    });

    it("should handle happy path with PySpark variable: RDDTakeSampleAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RDDTakeSampleAndConstruct
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=df.count(), withReplacement=False), columns=df.columns)"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=df.count(), withReplacement=False), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: RDDTakeSampleAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RDDTakeSampleAndConstruct,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=10, withReplacement=False), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=10, withReplacement=False), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable truncated rows and seed: RDDTakeSampleAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.RDDTakeSampleAndConstruct,
                truncationRows: 10,
                seed: 2
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=10, withReplacement=False, seed=2), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.rdd.takeSample(num=10, withReplacement=False, seed=2), columns=df.columns)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with PySpark variable: TailAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TailAndConstruct
            },
            {
                runtimeCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                ),
                displayCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.collect(), columns=df.columns)"].join(
                    "\n"
                )
            }
        );
    });

    it("should handle happy path with PySpark variable and truncated rows: TailAndConstruct", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TailAndConstruct,
                truncationRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "pandas_df = pd.DataFrame(df.tail(10), columns=df.columns)",
                    "if len(pandas_df) == 10:",
                    "    print('{\"truncated\": true}')"
                ].join("\n"),
                displayCode: ["import pandas as pd", "pandas_df = pd.DataFrame(df.tail(10), columns=df.columns)"].join(
                    "\n"
                )
            }
        );
    });
});
