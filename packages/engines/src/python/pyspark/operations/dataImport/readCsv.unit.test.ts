import Operations from "./readCsv";
import { assertDataImportOperationCode } from "../testUtil";

const operation = Operations.ReadCsv;

describe("[PySpark] Data import operation: Read CSV", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'https://path/to/file.csv')"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with single quote", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/'file'.csv"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'https://path/to/\\'file\\'.csv')"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with relative uri", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                relativeFileUri: "path/to/file.csv"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'https://path/to/file.csv')"
                ].join("\n"),
                displayCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'path/to/file.csv')"
                ].join("\n")
            }
        );
    });

    it("should handle arrow engine enabled", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                useArrowEngine: true
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'https://path/to/file.csv')"
                ].join("\n")
            }
        );
    });

    it("should handle rows truncated", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                truncationsRows: 10
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.csv(r'https://path/to/file.csv')"
                ].join("\n")
            }
        );
    });
});
