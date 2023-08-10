import { IGenericDataImportOperation, LocalizedStrings, OperationCodeGenResultType } from "@dw/orchestrator";

/**
 * Args for the read parquet data import operation.
 */
export type IReadParquetImportOperationArgs = {
    FileUri: string;
    RelativeFileUri?: string;
};
type IReadParquetImportOperationBaseProgram = {
    variableName: string;
    fileUri: string;
    relativeFileUri?: string;
};

/**
 * Operation to read parquet files.
 */
export const ReadParquetImportOperationBase: () => IGenericDataImportOperation<
    IReadParquetImportOperationArgs,
    IReadParquetImportOperationBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    generateBaseProgram: (context) => {
        return {
            result: OperationCodeGenResultType.Success,
            getBaseProgram: () => ({
                variableName: context.defaultVariableName,
                fileUri: context.args.FileUri,
                relativeFileUri: context.args.RelativeFileUri
            }),
            getDescription: (locale) => {
                return context.formatString(
                    context.getLocalizedStrings(locale).CreateFromFileUriHistoryItemDescription,
                    context.defaultVariableName,
                    context.args.RelativeFileUri ?? context.args.FileUri
                );
            },
            getTelemetryProperties: () => ({
                properties: {
                    hasRelativeUri: String(!!context.args.RelativeFileUri)
                }
            }),
            variableName: context.defaultVariableName
        };
    },
    getArgs: () => []
});
