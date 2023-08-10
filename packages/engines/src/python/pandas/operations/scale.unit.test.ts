import Operations from "./scale";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Scale;

describe("[Pandas] Column operation: Scale column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "new_min, new_max = 0, 1",
                    "old_min, old_max = df['Some_column'].min(), df['Some_column'].max()",
                    "df['Some_column'] = (df['Some_column'] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "new_min, new_max = 0, 1",
                    "old_min, old_max = df['\\'Some_column\\''].min(), df['\\'Some_column\\''].max()",
                    "df['\\'Some_column\\''] = (df['\\'Some_column\\''] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "new_min, new_max = 0, 1",
                    "old_min, old_max = df['Some_column'].min(), df['Some_column'].max()",
                    "df['Some_column'] = (df['Some_column'] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min",
                    "old_min, old_max = df['Another_column'].min(), df['Another_column'].max()",
                    "df['Another_column'] = (df['Another_column'] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min"
                ].join("\n")
            }
        );
    });
});
