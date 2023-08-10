import Operations from "./rename";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Rename;

describe("[PySpark] Column operation: Rename column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnName: "New_column_name"
            },
            {
                code: "df = df.withColumnRenamed('Some_column', 'New_column_name')"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'\\'Some_column\\''",
                newColumnName: "'New_column_name'"
            },
            {
                code: "df = df.withColumnRenamed('\\'Some_column\\'', '\\'New_column_name\\'')"
            }
        );
    });
});
