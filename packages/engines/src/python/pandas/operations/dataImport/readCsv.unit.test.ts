import Operations from "./readCsv";
import { assertDataImportOperationCode } from "../testUtil";

const operation = Operations.ReadCsv;

describe("[Pandas] Data import operation: Read CSV", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv"
            },
            {
                runtimeCode: ["import pandas as pd", "df = pd.read_csv(r'https://path/to/file.csv')"].join("\n")
            }
        );
    });

    it("should handle happy path with single quote", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/'file'.csv"
            },
            {
                runtimeCode: ["import pandas as pd", "df = pd.read_csv(r'https://path/to/\\'file\\'.csv')"].join("\n")
            }
        );
    });

    it("should handle happy path with relative uri", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                relativeFileUri: "path/to/file.csv"
            },
            {
                runtimeCode: ["import pandas as pd", "df = pd.read_csv(r'https://path/to/file.csv')"].join("\n"),
                displayCode: ["import pandas as pd", "df = pd.read_csv(r'path/to/file.csv')"].join("\n")
            }
        );
    });

    it("should handle arrow engine enabled", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                useArrowEngine: true
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "df = pd.read_csv(r'https://path/to/file.csv', engine='pyarrow')"
                ].join("\n")
            }
        );
    });

    it("should handle rows truncated", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                truncationsRows: 10
            },
            {
                runtimeCode: [
                    "import pandas as pd",
                    "df = pd.read_csv(r'https://path/to/file.csv', nrows=11)",
                    "if len(df) > 10:",
                    "    print('{\"truncated\": true}')",
                    "    df = df.head(10)"
                ].join("\n"),
                displayCode: ["import pandas as pd", "df = pd.read_csv(r'https://path/to/file.csv')"].join("\n")
            }
        );
    });
});
