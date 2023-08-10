import Operations from "./clone";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Clone;

describe("[Pandas] Column operation: Clone column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnName: "New_column_name"
            },
            {
                code: "df['New_column_name'] = df.loc[:, 'Some_column']"
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
                code: "df['\\'New_column_name\\''] = df.loc[:, '\\'Some_column\\'']"
            }
        );
    });
});
