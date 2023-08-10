import { IDataFrameHeader } from "./dataframe";

/**
 * Returns true if the current history index allows for editing the last applied operation.
 */
export function isEditingLastAppliedOperation(args: {
    activeHistoryIndex: number | undefined;
    historyItemsLength: number;
    enableEditLastAppliedOperation: boolean;
}) {
    const { activeHistoryIndex, historyItemsLength, enableEditLastAppliedOperation } = args;
    return enableEditLastAppliedOperation && activeHistoryIndex === historyItemsLength - 1 && activeHistoryIndex !== 0;
}

/**
 * Returns true if the provided df is a preview for the last applied operation.
 */
export function isPreviewingUpdatesToLastAppliedOperation(args: {
    dataFrameHeader: IDataFrameHeader | undefined;
    historyItemsLength: number;
    enableEditLastAppliedOperation: boolean;
}) {
    const { dataFrameHeader, historyItemsLength, enableEditLastAppliedOperation } = args;
    return !!(
        (enableEditLastAppliedOperation && // is the feature flag enabled?
            dataFrameHeader?.isPreview && // is the data frame corresponding to this specific index a preview df?
            dataFrameHeader?.historyItem.index === historyItemsLength - 1 &&
            dataFrameHeader?.historyItem.index !== 0) ||
        (dataFrameHeader?.displayedDueToError && dataFrameHeader?.historyItem.index === historyItemsLength - 2) || // is this a rejected df?
        (dataFrameHeader?.codeGenPreviewHistoryItem && // is the data frame one that has non-executed code?
            dataFrameHeader?.codeGenPreviewHistoryItem.index === historyItemsLength - 1 &&
            dataFrameHeader?.codeGenPreviewHistoryItem.index !== 0)
    );
}
