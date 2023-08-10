import { ColumnType, TranslationValidationResultType } from "@dw/messaging";
import { FillMethod } from "../../../core/operations/fillNa";
import Operations from "./fillNa";
import { assertOperationCode } from "./testUtil";

const operation = Operations.FillNa;

describe("[PySpark] Column operation: Fill missing values", () => {
    it("[method=mean] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: [
                    "from pyspark.ml.feature import Imputer",
                    "cols = ['Some_column']",
                    "imputer = Imputer(inputCols=cols, outputCols=cols, strategy='mean')",
                    "df = imputer.fit(df).transform(df)"
                ].join("\n")
            }
        );
    });

    it("[method=median] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Median
                }
            },
            {
                code: [
                    "from pyspark.ml.feature import Imputer",
                    "cols = ['Some_column']",
                    "imputer = Imputer(inputCols=cols, outputCols=cols, strategy='median')",
                    "df = imputer.fit(df).transform(df)"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "The median in PySpark is approximated for performance reasons."
                }
            }
        );
    });

    it("[method=mode] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mode
                }
            },
            {
                code: [
                    "from pyspark.ml.feature import Imputer",
                    "cols = ['Some_column']",
                    "imputer = Imputer(inputCols=cols, outputCols=cols, strategy='mode')",
                    "df = imputer.fit(df).transform(df)"
                ].join("\n")
            }
        );
    });

    it("[method=bfill] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Bfill
                }
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "import sys",
                    "temp_id = str(uuid.uuid4())",
                    "df = df.withColumn(temp_id, F.monotonically_increasing_id())",
                    "window = Window.orderBy(temp_id).rowsBetween(0, sys.maxsize)",
                    "df = df.withColumn('Some_column', F.first('Some_column', ignorenulls=True).over(window))",
                    "df = df.drop(temp_id)"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("[method=ffill] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Ffill
                }
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "from pyspark.sql import Window",
                    "import uuid",
                    "temp_id = str(uuid.uuid4())",
                    "df = df.withColumn(temp_id, F.monotonically_increasing_id())",
                    "window = Window.orderBy(temp_id)",
                    "df = df.withColumn('Some_column', F.last('Some_column', ignorenulls=True).over(window))",
                    "df = df.drop(temp_id)"
                ].join("\n"),
                validationResult: {
                    type: TranslationValidationResultType.Warning,
                    message: "This was generated to match the original pandas logic but may have performance issues."
                }
            }
        );
    });

    it("[method=custom] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Custom,
                    parameter: 3
                }
            },
            {
                code: "df = df.fillna(value=3, subset=['Some_column'])"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: [
                    "from pyspark.ml.feature import Imputer",
                    "cols = ['\\'Some_column\\'']",
                    "imputer = Imputer(inputCols=cols, outputCols=cols, strategy='mean')",
                    "df = imputer.fit(df).transform(df)"
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
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: [
                    "from pyspark.ml.feature import Imputer",
                    "cols = ['Some_column', 'Another_column']",
                    "imputer = Imputer(inputCols=cols, outputCols=cols, strategy='mean')",
                    "df = imputer.fit(df).transform(df)"
                ].join("\n")
            }
        );
    });
});
