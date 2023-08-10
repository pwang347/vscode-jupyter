import { ReadCsvImportOperationBase } from "./readCsv";
import { getDataImportOperationContext, assertDataImportOperationBaseProgramGenSuccess } from "../testUtil";

const operation = ReadCsvImportOperationBase();

describe("[Base Program] Data import operation: Read CSV", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.csv"
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv"
            },
            "Loaded variable 'df' from URI: https://path/to/file.csv"
        );
    });

    it("should handle happy path with relative uri", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.csv",
                RelativeFileUri: "path/to/file.csv"
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                relativeFileUri: "path/to/file.csv"
            },
            "Loaded variable 'df' from URI: path/to/file.csv"
        );
    });

    it("should handle arrow engine enabled", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.csv",
                UseArrowEngine: true
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                useArrowEngine: true
            },
            "Loaded variable 'df' from URI: https://path/to/file.csv"
        );
    });

    it("should handle rows truncated", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.csv",
                TruncationRows: 10
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.csv",
                truncationsRows: 10
            },
            "Loaded variable 'df' from URI: https://path/to/file.csv"
        );
    });
});
