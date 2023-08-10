import Operations from "./variable";
import { assertDataImportOperationCode } from "../testUtil";
import { DataFrameTypeIdentifier, PySparkDataFrameConversionMethod } from "@dw/orchestrator";

const operation = Operations.Variable;

describe("[PySpark] Data import operation: Variable", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.Pandas,
                variableName: "df"
            },
            {
                runtimeCode: ""
            }
        );
    });

    it("should handle happy path with truncated rows", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.Pandas,
                variableName: "df",
                truncationRows: 10
            },
            {
                runtimeCode: ["if len(df) > 10:", "    df = df.head(10)", "    print('{\"truncated\": true}')"].join(
                    "\n"
                ),
                displayCode: ""
            }
        );
    });

    it("should handle happy path with PySpark variable (default conversion method)", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df"
            },
            {
                runtimeCode: ""
            }
        );
    });

    it("should handle happy path with PySpark variable (default conversion method with truncation)", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                truncationRows: 10
            },
            {
                runtimeCode: ["if len(df) > 10:", "    df = df.head(10)", "    print('{\"truncated\": true}')"].join(
                    "\n"
                ),
                displayCode: ""
            }
        );
    });

    it("should handle happy path with PySpark variable (TakeAndConstruct conversion method)", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct
            },
            {
                runtimeCode: ""
            }
        );
    });

    it("should handle happy path with PySpark variable (TakeAndConstruct conversion method with truncation)", async () => {
        await assertDataImportOperationCode(
            operation,
            {
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                variableName: "df",
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct,
                truncationRows: 10
            },
            {
                runtimeCode: ["if len(df) > 10:", "    df = df.head(10)", "    print('{\"truncated\": true}')"].join(
                    "\n"
                ),
                displayCode: ""
            }
        );
    });
});
