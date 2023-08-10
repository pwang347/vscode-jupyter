import Operations from "./clone";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Clone;

describe("[PySpark] Column operation: Clone column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnName: "New_column_name"
            },
            {
                code: "df = df.withColumn('New_column_name', df['Some_column'])"
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
                code: "df = df.withColumn('\\'New_column_name\\'', df['\\'Some_column\\''])"
            }
        );
    });
});
