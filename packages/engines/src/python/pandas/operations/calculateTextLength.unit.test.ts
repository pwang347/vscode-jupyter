import Operations from "./calculateTextLength";
import { assertOperationCode } from "./testUtil";

const operation = Operations.CalculateTextLength;

describe("[Pandas] Column operation: Calculate text length for column", () => {
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
                code: "df.insert(1, 'New_column_name', df['Some_column'].str.len())"
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
                code: "df.insert(1, '\\'New_column_name\\'', df['\\'Some_column\\''].str.len())"
            }
        );
    });
});
