import Operations from "./convertToCapitalCase";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ConvertToCapitalCase;

describe("[Pandas] Column operation: Convert to capital case", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: false
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.capitalize()"
            }
        );
    });

    it("should handle happy path for 1 selected column and capitalize words set to true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: true
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.title()"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                capitalizeWords: false
            },
            {
                code: "df['\\'Some_column\\''] = df['\\'Some_column\\''].str.capitalize()"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                capitalizeWords: false
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.capitalize()\ndf['Another_column'] = df['Another_column'].str.capitalize()"
            }
        );
    });
});
