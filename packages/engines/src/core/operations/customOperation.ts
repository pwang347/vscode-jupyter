import { LocalizedStrings, OperationCodeGenResultType, PreviewStrategy, IGenericOperation } from "@dw/orchestrator";

type ICustomOperationArgs = {
    CustomCode?: string;
};
type ICustomOperationConfig = {
    extractComment: (code: string) => string | null;
    hasImport: (code: string) => boolean;
    hasFunction: (code: string) => boolean;
};
type ICustomOperationBaseProgram = {
    variableName: string;
    customCode: string;
};

/**
 * Base operation to perform custom operations.
 */
export const CustomOperationBase: (
    config: ICustomOperationConfig
) => IGenericOperation<ICustomOperationArgs, ICustomOperationBaseProgram, typeof LocalizedStrings.Orchestrator> = (
    config
) => ({
    isTranslationSupported: false,
    getHelpText: (ctx) => {
        return ctx.formatString(
            ctx.getLocalizedStrings(ctx.locale).OperationCustomOperationHelpText,
            ctx.variableToWrangle
        );
    },
    generateBaseProgram: (ctx) => {
        const code = ctx.args.CustomCode ?? "";
        return {
            getBaseProgram: () => ({
                variableName: ctx.variableName,
                customCode: code
            }),
            getDescription: (locale) =>
                config.extractComment(code) ||
                ctx.getLocalizedStrings(locale).OperationCustomOperationDefaultDescription,
            getTelemetryProperties: () => {
                return {
                    properties: {
                        hasImport: config.hasImport(code).toString(),
                        hasFunction: config.hasFunction(code).toString()
                    },
                    measurements: {
                        customCodeNumLines: code.split("\n").length
                    }
                };
            },
            previewStrategy: PreviewStrategy.Infer,
            result: OperationCodeGenResultType.Success
        };
    }
});
