import Operations from "./roundDecimals";
import { assertOperationCode } from "./testUtil";

const operation = Operations.RoundDecimals;

describe("[Pandas] Column operation: Round column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                decimals: 2
            },
            {
                code: "df = df.round({'Some_column': 2})"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                decimals: 2
            },
            {
                code: "df = df.round({'\\'Some_column\\'': 2})"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                decimals: 2
            },
            {
                code: "df = df.round({'Some_column': 2, 'Another_column': 2})"
            }
        );
    });
});
