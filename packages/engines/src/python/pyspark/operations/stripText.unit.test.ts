import Operations from "./stripText";
import { StripTextType } from "../../../core/operations/stripText";
import { assertOperationCode } from "./testUtil";

const operation = Operations.StripText;

describe("[PySpark] Column operation: Strip column", () => {
    it("should handle happy path for 1 selected column with both leading and trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.All
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.trim(df['Some_column']))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with leading stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Leading
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.ltrim(df['Some_column']))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Trailing
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.rtrim(df['Some_column']))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with trailing stripped, escaped quote", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                stripType: StripTextType.Trailing
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'Some_column\\'', F.rtrim(df['\\'Some_column\\'']))"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns with trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                stripType: StripTextType.Trailing
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.rtrim(df['Some_column']))",
                    "df = df.withColumn('Another_column', F.rtrim(df['Another_column']))"
                ].join("\n")
            }
        );
    });
});
