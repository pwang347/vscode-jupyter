import { VariableImportOperationBase } from "./variable";
import { getDataImportOperationContext, assertDataImportOperationBaseProgramGenSuccess } from "../testUtil";
import { DataFrameTypeIdentifier, PySparkDataFrameConversionMethod } from "@dw/orchestrator";

const operation = VariableImportOperationBase();

describe("[Base Program] Data import operation: Variable", () => {
    it("should handle happy path", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                DataFrameType: DataFrameTypeIdentifier.Pandas,
                VariableName: "df"
            }),
            {
                variableName: "df",
                dataFrameType: DataFrameTypeIdentifier.Pandas
            },
            "Loaded variable 'df' from kernel state"
        );
    });

    it("should handle happy path with truncated rows", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                DataFrameType: DataFrameTypeIdentifier.Pandas,
                VariableName: "df",
                TruncationRows: 10
            }),
            {
                variableName: "df",
                dataFrameType: DataFrameTypeIdentifier.Pandas,
                truncationRows: 10
            },
            "Loaded variable 'df' from kernel state"
        );
    });

    it("should handle happy path with PySpark variable (default conversion method)", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                DataFrameType: DataFrameTypeIdentifier.PySpark,
                VariableName: "df",
                ConvertedVariableName: "pandas_df"
            }),
            {
                variableName: "df",
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                convertedVariableName: "pandas_df"
            },
            "Loaded variable 'df' from kernel state"
        );
    });

    it("should handle happy path with PySpark variable (TakeAndConstruct conversion method)", async () => {
        await assertDataImportOperationBaseProgramGenSuccess(
            operation,
            getDataImportOperationContext({
                DataFrameType: DataFrameTypeIdentifier.PySpark,
                VariableName: "df",
                ConvertedVariableName: "pandas_df",
                ConversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct
            }),
            {
                variableName: "df",
                dataFrameType: DataFrameTypeIdentifier.PySpark,
                convertedVariableName: "pandas_df",
                conversionMethod: PySparkDataFrameConversionMethod.TakeAndConstruct
            },
            "Loaded variable 'df' from kernel state"
        );
    });
});
