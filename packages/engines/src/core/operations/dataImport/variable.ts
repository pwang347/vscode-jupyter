import {
    DataFrameTypeIdentifier,
    IGenericDataImportOperation,
    IWranglerEngine,
    LocalizedStrings,
    OperationCodeGenResultType,
    PySparkDataFrameConversionMethod
} from "@dw/orchestrator";

/**
 * Args for the variable data import operation.
 */
export type IVariableImportOperationArgs = {
    DataFrameType: DataFrameTypeIdentifier;
    VariableName: string;
    TruncationRows?: number;
    TruncationFraction?: number;
    ConvertedVariableName?: string;
    ConversionMethod?: PySparkDataFrameConversionMethod;
    Seed?: number;
};
type IVariableImportOperationBaseProgram = {
    dataFrameType: DataFrameTypeIdentifier;
    variableName: string;
    truncationRows?: number;
    truncationFraction?: number;
    convertedVariableName?: string;
    conversionMethod?: PySparkDataFrameConversionMethod;
    seed?: number;
};

/**
 * Operation to import data using a variable in kernel memory.
 */
export const VariableImportOperationBase: () => IGenericDataImportOperation<
    IVariableImportOperationArgs,
    IVariableImportOperationBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    generateBaseProgram: (context) => {
        return {
            result: OperationCodeGenResultType.Success,
            getBaseProgram: () => ({
                dataFrameType: context.args.DataFrameType,
                variableName: context.args.VariableName,
                truncationRows: context.args.TruncationRows,
                truncationFraction: context.args.TruncationFraction,
                conversionMethod: context.args.ConversionMethod,
                convertedVariableName: context.args.ConvertedVariableName,
                seed: context.args.Seed
            }),
            getDescription: (locale) => {
                return context.formatString(
                    context.getLocalizedStrings(locale).CreateFromVariableHistoryItemDescription,
                    context.args.VariableName
                );
            },
            getPreparationTask: (engine: IWranglerEngine) => {
                return engine.prepareVariable(context.args.VariableName);
            },
            getExecutionOutputMetadata: (executionOutput: string) => {
                try {
                    return JSON.parse(executionOutput);
                } catch (e) {
                    return {};
                }
            },
            getTelemetryProperties: () => ({
                properties: {
                    dataFrameType: context.args.DataFrameType,
                    ...(context.args.ConversionMethod ? { conversionMethod: context.args.ConversionMethod } : {})
                },
                measurements: {
                    ...(context.args.TruncationRows ?? 0 > 0 ? { truncationRows: context.args.TruncationRows } : {})
                }
            }),
            variableName: context.args.ConvertedVariableName ?? context.args.VariableName,
            originalVariableName: context.args.ConvertedVariableName ? context.args.VariableName : undefined
        };
    },
    getArgs: () => []
});
