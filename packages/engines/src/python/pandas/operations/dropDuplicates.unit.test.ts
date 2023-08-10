import Operations from "./dropDuplicates";
import { assertOperationCode } from "./testUtil";

const operation = Operations.DropDuplicates;

describe("[Pandas] Column operation: Drop duplicates", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetingAllColumns: false
            },
            {
                code: "df = df.drop_duplicates(subset=['Some_column'])"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                targetingAllColumns: false
            },
            {
                code: "df = df.drop_duplicates(subset=['\\'Some_column\\''])"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                targetingAllColumns: false
            },
            {
                code: "df = df.drop_duplicates(subset=['Some_column', 'Another_column'])"
            }
        );
    });

    it("should handle happy path for all selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                targetingAllColumns: true
            },
            {
                code: "df = df.drop_duplicates()"
            }
        );
    });
});
