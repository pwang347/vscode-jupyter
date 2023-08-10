import Operations from "./readParquet";
import { assertDataImportOperationCode } from "../testUtil";

const operation = Operations.ReadParquet;

describe("[PySpark] Data import operation: Read Parquet", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.parquet"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.parquet(r'https://path/to/file.parquet')"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with single quote", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/'file'.parquet"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.parquet(r'https://path/to/\\'file\\'.parquet')"
                ].join("\n")
            }
        );
    });

    it("should handle happy path with relative uri", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.parquet",
                relativeFileUri: "path/to/file.parquet"
            },
            {
                runtimeCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.parquet(r'https://path/to/file.parquet')"
                ].join("\n"),
                displayCode: [
                    "from pyspark.sql import SparkSession",
                    "spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()",
                    "df = spark.read.parquet(r'path/to/file.parquet')"
                ].join("\n")
            }
        );
    });
});
