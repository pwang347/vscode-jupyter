import Operations from "./roundUp";
import { assertOperationCode } from "./testUtil";

const operation = Operations.RoundUp;

describe("[Pandas] Column operation: Round up column (ceiling)", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            {
                code: ["import numpy as np", "df[['Some_column']] = np.ceil(df[['Some_column']])"].join("\n")
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
                code: ["import numpy as np", "df[['\\'Some_column\\'']] = np.ceil(df[['\\'Some_column\\'']])"].join(
                    "\n"
                )
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
                code: [
                    "import numpy as np",
                    "df[['Some_column', 'Another_column']] = np.ceil(df[['Some_column', 'Another_column']])"
                ].join("\n")
            }
        );
    });
});
