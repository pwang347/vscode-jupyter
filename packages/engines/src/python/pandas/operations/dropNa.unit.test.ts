import Operations from "./dropNa";
import { assertOperationCode } from "./testUtil";

const operation = Operations.DropNa;

describe("[Pandas] Column operation: Drop missing values", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetingAllColumns: false
            },
            {
                code: "df = df.dropna(subset=['Some_column'])"
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
                code: "df = df.dropna(subset=['\\'Some_column\\''])"
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
                code: "df = df.dropna(subset=['Some_column', 'Another_column'])"
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
                code: "df = df.dropna()"
            }
        );
    });
});
