import Operations from "./convertToLowercase";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ConvertToLowercase;

describe("[Pandas] Column operation: Convert to lowercase", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.lower()"
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
                code: "df['\\'Some_column\\''] = df['\\'Some_column\\''].str.lower()"
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
                code: "df['Some_column'] = df['Some_column'].str.lower()\ndf['Another_column'] = df['Another_column'].str.lower()"
            }
        );
    });
});
