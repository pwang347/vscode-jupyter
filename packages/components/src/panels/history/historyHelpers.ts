import { IHistoryItem, IOperationView, OperationKey } from "@dw/messaging";

/**
 * Calculates the name or label to be associated with a given history item (or operation key).
 * Returns null if none can be found.
 */
export function getOperationLabel(
    item: IHistoryItem | null,
    defaultKey: string | undefined,
    operations: IOperationView[],
    useCustomOperationDescription = true
) {
    // For custom operations and described operations in the cleaning steps panel we use the description, which should be the content of the first comment.
    if (
        useCustomOperationDescription &&
        (item?.operation.key === OperationKey.CustomOperation ||
            item?.operation.key === OperationKey.DescribeYourOperation) &&
        item.description.trim()
    ) {
        return item.description;
    }

    const operationKey = item ? item.operation.key : defaultKey;
    return (
        // If there is an operation key, try to find the operation in the list of operations and use its name.
        (operationKey && operations.find((op) => op.key === operationKey)?.name) ??
        // Fallback to the item description, or "choose an operation" if the item is null.
        item?.description
    );
}
