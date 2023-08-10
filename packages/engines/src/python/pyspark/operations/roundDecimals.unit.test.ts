import Operations from "./roundDecimals";
import { assertOperationCode } from "./testUtil";

const operation = Operations.RoundDecimals;

describe("[PySpark] Column operation: Round column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                decimals: 2
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.round(F.col('Some_column'), 2))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                decimals: 2
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'Some_column\\'', F.round(F.col('\\'Some_column\\''), 2))"
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
                decimals: 2
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.round(F.col('Some_column'), 2))",
                    "df = df.withColumn('Another_column', F.round(F.col('Another_column'), 2))"
                ].join("\n")
            }
        );
    });
});
