import Operations from "./select";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Select;

describe("[Pandas] Column operation: Select column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            {
                code: "df = df.loc[:, ['Some_column']]"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"]
            },
            {
                code: "df = df.loc[:, ['\\'Some_column\\'']]"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"]
            },
            {
                code: "df = df.loc[:, ['Some_column', 'Another_column']]"
            }
        );
    });
});
