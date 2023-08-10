import { ArgType, IDataFrame, createArg, formatString } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation,
    ICompletionResult,
    INaturalLanguageClient
} from "@dw/orchestrator";

type IDescribeYourOperationOperationArgs = {
    Prompt: string;
};
type IDescribeYourOperationConfig = {
    createWranglingCompletion: (
        client: INaturalLanguageClient,
        variableName: string,
        dataFrame: IDataFrame,
        prompt: string
    ) => Promise<ICompletionResult>;
};
type IDescribeYourOperationBaseProgram = {
    variableName: string;
    customCode: string;
};

/**
 * Base operation to describe a custom operation.
 */
export const DescribeYourOperationBase: (
    config: IDescribeYourOperationConfig
) => IGenericOperation<
    IDescribeYourOperationOperationArgs,
    IDescribeYourOperationBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = (config) => ({
    isTranslationSupported: false,
    generateBaseProgram: async (ctx) => {
        const locStrings = ctx.getLocalizedStrings(ctx.locale);
        if (!(await ctx.naturalLanguageClient.isConfigured())) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: ctx.naturalLanguageClient.getNotConfiguredMessage(),
                inputErrors: {
                    Prompt: ctx.naturalLanguageClient.getNotConfiguredMessage()
                }
            };
        }
        if (ctx.args.Prompt.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete,
                inputErrors: ctx.isFirstRun
                    ? undefined
                    : {
                          Prompt: locStrings.OperationDescribeYourOperationArgsPromptMissingError
                      }
            };
        }
        const { code, foundNullCharacter } = await config.createWranglingCompletion(
            ctx.naturalLanguageClient,
            ctx.variableName,
            ctx.dataframe,
            ctx.args.Prompt
        );
        if (!code) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: locStrings.OperationDescribeYourOperationErrorNoCodeGenerated
            };
        }
        return {
            getBaseProgram: () => ({
                variableName: ctx.variableName,
                customCode: code
            }),
            getDescription: () =>
                foundNullCharacter
                    ? formatString(locStrings.OperationDescribeYourOperationDescriptionNullCharacter, ctx.args.Prompt)
                    : ctx.args.Prompt,
            previewStrategy: PreviewStrategy.Infer,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx) => [
        createArg("Prompt", ArgType.String, {
            multiline: true,
            usePreviewButton: true,
            placeholder: ctx.getLocalizedStrings(ctx.locale).OperationDescribeYourOperationArgsPromptPlaceholder,
            focusOnMount: true
        })
    ]
});
