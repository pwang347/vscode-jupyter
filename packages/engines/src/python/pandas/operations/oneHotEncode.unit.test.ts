import Operations from "./oneHotEncode";
import { assertOperationCode } from "./testUtil";

const operation = Operations.OneHotEncode;

describe("[Pandas] Column operation: One-hot encode", () => {
    it("[encodeMissingValues=false] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: false
            },
            {
                code: ["import pandas as pd", "df = pd.get_dummies(df, columns=['Some_column'])"].join("\n")
            }
        );
    });

    it("[encodeMissingValues=true] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: true
            },
            {
                code: ["import pandas as pd", "df = pd.get_dummies(df, columns=['Some_column'], dummy_na=True)"].join(
                    "\n"
                )
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                encodeMissingValues: false
            },
            {
                code: ["import pandas as pd", "df = pd.get_dummies(df, columns=['\\'Some_column\\''])"].join("\n")
            }
        );
    });

    it("[encodeMissingValues=false] should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                encodeMissingValues: false
            },
            {
                code: [
                    "import pandas as pd",
                    "df = pd.get_dummies(df, columns=['Some_column', 'Another_column'])"
                ].join("\n")
            }
        );
    });

    it("[encodeMissingValues=true] should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                encodeMissingValues: true
            },
            {
                code: [
                    "import pandas as pd",
                    "df = pd.get_dummies(df, columns=['Some_column', 'Another_column'], dummy_na=True)"
                ].join("\n")
            }
        );
    });
});
