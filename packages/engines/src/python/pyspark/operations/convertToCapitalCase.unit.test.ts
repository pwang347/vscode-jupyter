import Operations from "./convertToCapitalCase";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ConvertToCapitalCase;

describe("[PySpark] Column operation: Convert to capital case", () => {
    it("should handle happy path for 1 selected column and capitalize words set to false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: false
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "from pyspark.sql import functions as F",
                    "udf_capitalize = F.pandas_udf(lambda x: x.str.capitalize(), T.StringType())",
                    "df = df.withColumn('Some_column', udf_capitalize('Some_column'))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column and capitalize words set to true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: true
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.initcap(F.col('Some_column')))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name and capitalize words set to false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                capitalizeWords: false
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "from pyspark.sql import functions as F",
                    "udf_capitalize = F.pandas_udf(lambda x: x.str.capitalize(), T.StringType())",
                    "df = df.withColumn('\\'Some_column\\'', udf_capitalize('\\'Some_column\\''))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name and capitalize words set to true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                capitalizeWords: true
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'Some_column\\'', F.initcap(F.col('\\'Some_column\\'')))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns and capitalize words set to false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                capitalizeWords: false
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "from pyspark.sql import functions as F",
                    "udf_capitalize = F.pandas_udf(lambda x: x.str.capitalize(), T.StringType())",
                    "df = df.withColumn('Some_column', udf_capitalize('Some_column'))",
                    "df = df.withColumn('Another_column', udf_capitalize('Another_column'))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns and capitalize words set to true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                capitalizeWords: true
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.initcap(F.col('Some_column')))",
                    "df = df.withColumn('Another_column', F.initcap(F.col('Another_column')))"
                ].join("\n")
            }
        );
    });
});
