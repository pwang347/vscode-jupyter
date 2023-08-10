import { ColumnType, TranslationValidationResultType } from "@dw/messaging";
import { PandasDTypes } from "../types";
import Operations from "./changeType";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ChangeType;

describe("[Pandas] Column operation: Change column type", () => {
    it("[type=object] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Object,
                    type: ColumnType.Unknown,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'object'})"
            }
        );
    });

    it("[type=string with pandas < 1.0.0] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.String,
                    type: ColumnType.String,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {
                        pandas: {
                            installedVersion: "0.25.0",
                            requiredVersion: "0.0.1"
                        }
                    },
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'object'})"
            }
        );
    });

    it("[type=string with pandas >= 1.0.0] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.String,
                    type: ColumnType.String,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {
                        pandas: {
                            installedVersion: "1.0.0",
                            requiredVersion: "0.0.1"
                        }
                    },
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'string'})"
            }
        );
    });

    it("[type=datetime64[ns]] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.DateTime64,
                    type: ColumnType.Datetime,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'datetime64[ns]'})"
            }
        );
    });

    it("[type=category] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Category,
                    type: ColumnType.Category,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'category'})"
            }
        );
    });

    it("[type=float16] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Float16,
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
                code: "df = df.astype({'Some_column': 'float16'})"
            }
        );
    });

    it("[type=float32] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Float32,
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
                code: "df = df.astype({'Some_column': 'float32'})"
            }
        );
    });

    it("[type=float64] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Float64,
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
                code: "df = df.astype({'Some_column': 'float64'})"
            }
        );
    });

    it("[type=int8] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Int8,
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
                code: "df = df.astype({'Some_column': 'int8'})"
            }
        );
    });

    it("[type=int16] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Int16,
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
                code: "df = df.astype({'Some_column': 'int16'})"
            }
        );
    });

    it("[type=int32] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Int32,
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
                code: "df = df.astype({'Some_column': 'int32'})"
            }
        );
    });

    it("[type=int64] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Int64,
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
                code: "df = df.astype({'Some_column': 'int64'})"
            }
        );
    });

    it("[type=uint8] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.UInt8,
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
                code: "df = df.astype({'Some_column': 'uint8'})"
            }
        );
    });

    it("[type=uint16] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.UInt16,
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
                code: "df = df.astype({'Some_column': 'uint16'})"
            }
        );
    });

    it("[type=uint32] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.UInt32,
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
                code: "df = df.astype({'Some_column': 'uint32'})"
            }
        );
    });

    it("[type=uint64] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.UInt64,
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
                code: "df = df.astype({'Some_column': 'uint64'})"
            }
        );
    });

    it("[type=bool] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: PandasDTypes.Bool,
                    type: ColumnType.Boolean,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'bool'})"
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
                    label: "float256",
                    type: ColumnType.Float,
                    metadata: {
                        bits: 256
                    }
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
                    message: "Equivalent translation for type 'float256' does not exist"
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
                    label: PandasDTypes.Object,
                    type: ColumnType.Unknown,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'\\'Some_column\\'': 'object'})"
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
                    label: PandasDTypes.Object,
                    type: ColumnType.Unknown,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            {
                code: "df = df.astype({'Some_column': 'object', 'Another_column': 'object'})"
            }
        );
    });
});
