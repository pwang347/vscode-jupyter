import Operations from "./convertToUppercase";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ConvertToUppercase;

describe("[PySpark] Column operation: Convert to uppercase", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.upper(F.col('Some_column')))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'Some_column\\'', F.upper(F.col('\\'Some_column\\'')))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.upper(F.col('Some_column')))",
                    "df = df.withColumn('Another_column', F.upper(F.col('Another_column')))"
                ].join("\n")
            }
        );
    });
});
