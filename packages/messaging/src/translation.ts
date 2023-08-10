/**
 * Types of validation results.
 */
export enum TranslationValidationResultType {
    Success = "success",
    Warning = "warning",
    MultiWarning = "multiWarning"
}

/**
 * Result of translation validation.
 */
export type TranslationValidationResult =
    | {
          type: TranslationValidationResultType.Success;
      }
    | {
          type: TranslationValidationResultType.Warning;
          id: string;
          getMessage: (locale: string) => string;
      }
    | {
          type: TranslationValidationResultType.MultiWarning;
          warnings: Array<{ id: string; getMessage: (locale: string) => string }>;
      };
