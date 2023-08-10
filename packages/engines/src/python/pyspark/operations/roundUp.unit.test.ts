import Operations from "./roundUp";
import { assertOperationCode } from "./testUtil";

const operation = Operations.RoundUp;

describe("[PySpark] Column operation: Round up column (ceiling)", () => {
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
                    "df = df.withColumn('Some_column', F.ceil(F.col('Some_column')))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"]
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'Some_column\\'', F.ceil(F.col('\\'Some_column\\'')))"
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
                    "df = df.withColumn('Some_column', F.ceil(F.col('Some_column')))",
                    "df = df.withColumn('Another_column', F.ceil(F.col('Another_column')))"
                ].join("\n")
            }
        );
    });
});
