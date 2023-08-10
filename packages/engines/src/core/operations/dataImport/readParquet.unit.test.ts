import { ReadParquetImportOperationBase } from "./readParquet";
import { getDataImportOperationContext, assertDataImportOperationBaseProgramGenSuccess } from "../testUtil";

const operation = ReadParquetImportOperationBase();

describe("[Base Program] Data import operation: Read Parquet", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.parquet"
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.parquet"
            },
            "Loaded variable 'df' from URI: https://path/to/file.parquet"
        );
    });

    it("should handle happy path with relative uri", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                FileUri: "https://path/to/file.parquet",
                RelativeFileUri: "path/to/file.parquet"
            }),
            {
                variableName: "df",
                fileUri: "https://path/to/file.parquet",
                relativeFileUri: "path/to/file.parquet"
            },
            "Loaded variable 'df' from URI: path/to/file.parquet"
        );
    });
});
