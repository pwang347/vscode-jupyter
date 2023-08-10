import { DataImportOperationKey } from "@dw/messaging";
import { ReadCsvImportOperationBase } from "../../../../core/operations/dataImport/readCsv";
import { extendBaseDataImportOperation } from "../../../../core/translate";
import { escapeSingleQuote } from "../../../../core/operations/util";

export default {
    [DataImportOperationKey.ReadCsv]: extendBaseDataImportOperation(ReadCsvImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, fileUri, relativeFileUri } = ctx.baseProgram;
            // TODO@DW: handle unsupported arguments
            return {
                getRuntimeCode: () =>
                    [
                        `from pyspark.sql import SparkSession`,
                        `spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()`,
                        `${df} = spark.read.csv(r'${escapeSingleQuote(fileUri)}')`
                    ].join("\n"),
                getDisplayCode: () =>
                    [
                        `from pyspark.sql import SparkSession`,
                        `spark = SparkSession.builder.appName('Data Wrangler').getOrCreate()`,
                        `${df} = spark.read.csv(r'${escapeSingleQuote(relativeFileUri ?? fileUri)}')`
                    ].join("\n")
            };
        }
    })
};
