import Operations from "./stripText";
import { StripTextType } from "../../../core/operations/stripText";
import { assertOperationCode } from "./testUtil";

const operation = Operations.StripText;

describe("[Pandas] Column operation: Strip column", () => {
    it("should handle happy path for 1 selected column with both leading and trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.All
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.strip()"
            }
        );
    });

    it("should handle happy path for 1 selected column with leading stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Leading
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.lstrip()"
            }
        );
    });

    it("should handle happy path for 1 selected column with trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Trailing
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.rstrip()"
            }
        );
    });

    it("should handle happy path for 1 selected column with trailing stripped, escaped quote", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                stripType: StripTextType.Trailing
            },
            {
                code: "df['\\'Some_column\\''] = df['\\'Some_column\\''].str.rstrip()"
            }
        );
    });

    it("should handle happy path for 2 selected columns with trailing stripped", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                stripType: StripTextType.Trailing
            },
            {
                code: [
                    "df['Some_column'] = df['Some_column'].str.rstrip()",
                    "df['Another_column'] = df['Another_column'].str.rstrip()"
                ].join("\n")
            }
        );
    });
});
