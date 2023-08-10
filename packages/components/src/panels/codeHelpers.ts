import { IHistoryItem, OperationKey } from "@dw/messaging";

export const getCodeWithDescription = (code: string, description: string, commentPrefix: string) => {
    const descriptionComment = `${commentPrefix}${description}`;
    if (!code) {
        return descriptionComment;
    }
    return `${descriptionComment}\n${code}`;
};

/**
 * Given a single history item, returns the corresponding code string.
 */
export const getCodeFromHistoryItem = (historyItem: IHistoryItem, commentPrefix: string) => {
    return historyItem.operation.key === OperationKey.CustomOperation
        ? historyItem.code
        : getCodeWithDescription(historyItem.code, historyItem.description, commentPrefix);
};

/**
 * Given a list of history items, returns a single concatenated code string.
 */
export const getCodeFromHistoryItems = (historyItems: IHistoryItem[], commentPrefix: string) => {
    const code = historyItems.map((h) => getCodeFromHistoryItem(h, commentPrefix)).join("\n\n");
    return code;
};
