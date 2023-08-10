import { IGenericDataImportOperation, LocalizedStrings, OperationCodeGenResultType } from "@dw/orchestrator";

/**
 * Args for the read parquet data import operation.
 */
export type IReadCsvImportOperationArgs = {
    FileUri: string;
    RelativeFileUri?: string;
    TruncationRows?: number;
    UseArrowEngine?: boolean;
};
type IReadCsvImportOperationBaseProgram = {
    variableName: string;
    fileUri: string;
    relativeFileUri?: string;
    truncationsRows?: number;
    useArrowEngine?: boolean;
};

/**
 * Operation to read CSV files.
 */
export const ReadCsvImportOperationBase: () => IGenericDataImportOperation<
    IReadCsvImportOperationArgs,
    IReadCsvImportOperationBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    generateBaseProgram: (context) => {
        return {
            result: OperationCodeGenResultType.Success,
            getBaseProgram: () => ({
                variableName: context.defaultVariableName,
                fileUri: context.args.FileUri,
                relativeFileUri: context.args.RelativeFileUri,
                truncationsRows: context.args.TruncationRows,
                useArrowEngine: context.args.UseArrowEngine
            }),
            getExecutionOutputMetadata: (output: string) => {
                try {
                    return JSON.parse(output);
                } catch (e) {
                    return {};
                }
            },
            getDescription: (locale) => {
                return context.formatString(
                    context.getLocalizedStrings(locale).CreateFromFileUriHistoryItemDescription,
                    context.defaultVariableName,
                    context.args.RelativeFileUri ?? context.args.FileUri
                );
            },
            getTelemetryProperties: () => ({
                properties: {
                    hasRelativeUri: String(!!context.args.RelativeFileUri),
                    usingArrowEngine: String(!!context.args.UseArrowEngine)
                },
                measurements: {
                    ...(context.args.TruncationRows ?? 0 > 0 ? { truncationRows: context.args.TruncationRows } : {})
                }
            }),
            variableName: context.defaultVariableName
        };
    },
    getArgs: () => []
});
