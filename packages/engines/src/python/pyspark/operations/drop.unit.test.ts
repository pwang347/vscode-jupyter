import Operations from "./drop";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Drop;

describe("[PySpark] Column operation: Drop column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            {
                code: "df = df.drop('Some_column')"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"]
            },
            {
                code: "df = df.drop('\\'Some_column\\'')"
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
                code: "df = df.drop('Some_column', 'Another_column')"
            }
        );
    });
});
