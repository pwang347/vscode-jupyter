/**
 * Client to interface with for handling natural language completions.
 */
export interface INaturalLanguageClient {
    isConfigured(): Promise<boolean>;
    getNotConfiguredMessage(): string;
    createCompletion(prompt: string): Promise<ICompletionResult>;
    addPromptToHistory(prompt: string): void;
    getParams(): ICompletionParams;
}

/**
 * Parameters used for completions.
 */
export interface ICompletionParams {
    includeColumnContext: boolean;
    includeDataContext: boolean;
    maxTokens: number;
}

/**
 * Result of a completion call.
 */
export interface ICompletionResult {
    code: string;
    foundNullCharacter: boolean;
}
