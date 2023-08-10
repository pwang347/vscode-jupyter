import { IHistoryItem } from "./history";
import { TranslationValidationResult } from "./translation";

/**
 * Options for code export.
 */
export interface IExportCodeOptions {
    engineId?: string;
    variableName?: string;
    preCode?: string;
    onTranslation?: (historyItem: IHistoryItem, validationResult: TranslationValidationResult) => void;
}
