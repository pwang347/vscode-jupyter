import { ColumnType, TranslationValidationResultType } from "@dw/messaging";
import { PySparkDTypes } from "../types";
import Operations from "./changeType";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ChangeType;

describe("[PySpark] Column operation: Change column type", () => {
    it("[type=String] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.String,
                    type: ColumnType.String,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.StringType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Timestamp] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Timestamp,
                    type: ColumnType.Datetime,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.TimestampType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Float] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Float,
                    type: ColumnType.Float,
                    metadata: {
                        bits: 32
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.FloatType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Float with 16 bits] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Float,
                    type: ColumnType.Float,
                    metadata: {
                        bits: 16
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.FloatType()))"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Could not convert to the specified bits for type"
                }
            }
        );
    });

    it("[type=Double] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Double,
                    type: ColumnType.Float,
                    metadata: {
                        bits: 64
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.DoubleType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Byte] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Byte,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: false,
                        bits: 8
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.ByteType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Byte unsigned] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Byte,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: true,
                        bits: 8
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.ByteType()))"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Could not convert to unsigned type, instead converted to a signed type"
                }
            }
        );
    });

    it("[type=Short] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Short,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: false,
                        bits: 16
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.ShortType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Short unsigned] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Short,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: true,
                        bits: 16
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.ShortType()))"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Could not convert to unsigned type, instead converted to a signed type"
                }
            }
        );
    });

    it("[type=Integer] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Integer,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: false,
                        bits: 32
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.IntegerType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Integer unsigned] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Integer,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: true,
                        bits: 32
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.IntegerType()))"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Could not convert to unsigned type, instead converted to a signed type"
                }
            }
        );
    });

    it("[type=Long] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Long,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: false,
                        bits: 64
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.LongType()))"
                ].join("\n")
            }
        );
    });

    it("[type=Long unsigned] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Long,
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: true,
                        bits: 64
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.LongType()))"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Could not convert to unsigned type, instead converted to a signed type"
                }
            }
        );
    });

    it("[type=Boolean] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PySparkDTypes.Boolean,
                    type: ColumnType.Boolean,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.BooleanType()))"
                ].join("\n")
            }
        );
    });

    it("should produce no code and warning for unsupported type", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: "timedelta",
                    type: ColumnType.Timedelta,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "",
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "Equivalent translation for type 'timedelta' does not exist"
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
                targetType: {
                    label: PySparkDTypes.String,
                    type: ColumnType.String,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('\\'Some_column\\'', df['\\'Some_column\\''].cast(T.StringType()))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                targetType: {
                    label: PySparkDTypes.String,
                    type: ColumnType.String,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "df = df.withColumn('Some_column', df['Some_column'].cast(T.StringType()))",
                    "df = df.withColumn('Another_column', df['Another_column'].cast(T.StringType()))"
                ].join("\n")
            }
        );
    });
});
