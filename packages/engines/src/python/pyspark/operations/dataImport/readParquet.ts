import { DataImportOperationKey } from "@dw/messaging";
import { ReadParquetImportOperationBase } from "../../../../core/operations/dataImport/readParquet";
import { extendBaseDataImportOperation } from "../../../../core/translate";
import { escapeSingleQuote } from "../../../../core/operations/util";

export default {
    [DataImportOperationKey.ReadParquet]: extendBaseDataImportOperation(ReadParquetImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, fileUri, relativeFileUri } = ctx.baseProgram;
            return {
                getRuntimeCode: () =>
                    [
                        `from pyspark.sql import SparkSession`,
                        `spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()`,
                        `${df} = spark.read.parquet(r'${escapeSingleQuote(fileUri)}')`
                    ].join("\n"),
                getDisplayCode: () =>
                    [
                        `from pyspark.sql import SparkSession`,
                        `spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()`,
                        `${df} = spark.read.parquet(r'${escapeSingleQuote(relativeFileUri ?? fileUri)}')`
                    ].join("\n")
            };
        }
    })
};
