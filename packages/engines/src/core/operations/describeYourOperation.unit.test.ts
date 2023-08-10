import { ICompletionParams, INaturalLanguageClient } from "@dw/orchestrator";
import { DescribeYourOperationBase } from "./describeYourOperation";
import {
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenFailure,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const getMockNaturalLanguageClient = (options?: {
    isConfigured?: boolean;
    foundNullCharacter?: boolean;
    params?: ICompletionParams;
    noCodeGenerated?: boolean;
    generatedCode?: string;
}): INaturalLanguageClient => {
    const promptHistory: string[] = [];
    return {
        isConfigured: async () => options?.isConfigured ?? true,
        getNotConfiguredMessage: () => "Not configured",
        createCompletion: async () => ({
            code: options?.noCodeGenerated ? "" : options?.generatedCode ?? "Some generated code",
            foundNullCharacter: Boolean(options?.foundNullCharacter)
        }),
        addPromptToHistory: (prompt: string) => {
            promptHistory.push(prompt);
        },
        getParams: () => {
            return (
                options?.params ?? {
                    includeColumnContext: false,
                    includeDataContext: false,
                    maxTokens: 2000
                }
            );
        }
    };
};

const operation = DescribeYourOperationBase({
    createWranglingCompletion: (client, _variableName, _dataFrame, prompt) => {
        return client.createCompletion(prompt);
    }
});

describe("[Base Program] Describe your operation", () => {
    it("should handle happy path", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            {
                ...getZeroColumnOperationContext({
                    Prompt: "Drop the Foo column"
                }),
                naturalLanguageClient: getMockNaturalLanguageClient({})
            },
            {
                variableName: "df",
                customCode: "Some generated code"
            },
            "Drop the Foo column"
        );
    });

    it("should fail if NLP client is not configured", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            {
                ...getZeroColumnOperationContext({
                    Prompt: "Drop the Foo column"
                }),
                naturalLanguageClient: getMockNaturalLanguageClient({ isConfigured: false })
            },
            "Not configured",
            {
                Prompt: "Not configured"
            }
        );
    });

    it("should show error on prompt only if not first run", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            {
                ...getZeroColumnOperationContext({
                    Prompt: ""
                }),
                naturalLanguageClient: getMockNaturalLanguageClient({}),
                isFirstRun: false
            },
            {
                Prompt: "A prompt is required for this operation."
            }
        );

        await assertOperationBaseProgramGenIncomplete(operation, {
            ...getZeroColumnOperationContext({
                Prompt: ""
            }),
            naturalLanguageClient: getMockNaturalLanguageClient({}),
            isFirstRun: true
        });
    });

    it("should fail if no code generated", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            {
                ...getZeroColumnOperationContext({
                    Prompt: "Drop the Foo column"
                }),
                naturalLanguageClient: getMockNaturalLanguageClient({ noCodeGenerated: true })
            },
            "No code generated"
        );
    });
});
