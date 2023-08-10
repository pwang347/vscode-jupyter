import Operations from "./calculateTextLength";
import { assertOperationCode } from "./testUtil";

const operation = Operations.CalculateTextLength;

describe("[PySpark] Column operation: Calculate text length for column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnName: "New_column_name",
                newColumnInsertIndex: 1
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('New_column_name', F.length('Some_column'))",
                    "df = df.select(*df.columns[:1], 'New_column_name', *df.columns[1:])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'\\'Some_column\\''",
                newColumnName: "'New_column_name'",
                newColumnInsertIndex: 1
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('\\'New_column_name\\'', F.length('\\'Some_column\\''))",
                    "df = df.select(*df.columns[:1], '\\'New_column_name\\'', *df.columns[1:])"
                ].join("\n")
            }
        );
    });
});
