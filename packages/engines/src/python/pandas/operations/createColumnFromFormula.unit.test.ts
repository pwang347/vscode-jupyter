import Operations from "./createColumnFromFormula";
import { assertOperationCode } from "./testUtil";

const operation = Operations.CreateColumnFromFormula;

describe("[Pandas] Create column from formula", () => {
    it("should handle happy path", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnFormula: "1",
                columnName: "Some_new_column",
                isExistingColumn: true
            },
            {
                code: "df['Some_new_column'] = 1"
            }
        );
    });

    it("should handle happy path with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnFormula: "1",
                columnName: "'Some_new_column'",
                isExistingColumn: true
            },
            {
                code: "df['\\'Some_new_column\\''] = 1"
            }
        );
    });
});
