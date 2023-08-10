import {
    getDefaultArgs,
    IDataFrameHeader,
    IOperationContextMenuItemIdentifier,
    IOperationView,
    ISelection,
    WranglerContextMenuItem
} from "@dw/messaging";
import { createDefaultContextMenu } from "./defaultContextMenu";
import {
    ICreateOperationContextMenuContext,
    IOperationMenuItemPayload,
    WranglerContextMenuItemWithArgs
} from "./types";

/**
 * Represents the operation context menu.
 */
export class DataWranglerOperationContextMenu {
    private contextMenuItems: WranglerContextMenuItemWithArgs[] = [];
    private contextMenuItemsForView: WranglerContextMenuItem[] = [];
    private operationMenuItemCache: { [key: string]: IOperationMenuItemPayload } = {};

    constructor(
        context: ICreateOperationContextMenuContext,
        operationContextMenuOverride: (
            defaultContextMenu: WranglerContextMenuItemWithArgs[]
        ) => WranglerContextMenuItemWithArgs[] = (contextMenu) => contextMenu
    ) {
        this.contextMenuItems = operationContextMenuOverride(createDefaultContextMenu(context));
        this.contextMenuItemsForView = this.getViewMenuItemsDFS(this.contextMenuItems);
        this.buildOperationMenuItemCacheDFS(this.contextMenuItems);
    }

    /**
     * Depth-first traversal of nodes to build a map of ID to the operation item.
     */
    private buildOperationMenuItemCacheDFS(nodes: WranglerContextMenuItemWithArgs[]) {
        for (const node of nodes) {
            if (node.itemType === "operation") {
                const { menuId, key } = node.operation;
                this.operationMenuItemCache[menuId ?? key] = node.operation;
            } else if (node.itemType === "subMenu") {
                this.buildOperationMenuItemCacheDFS(node.subMenu);
            }
        }
    }

    /**
     * Depth-first traversal of nodes to strip off the properties not used in the UI.
     */
    private getViewMenuItemsDFS(nodes: WranglerContextMenuItemWithArgs[]): WranglerContextMenuItem[] {
        const newNodes: WranglerContextMenuItem[] = nodes.map((node) => {
            if (node.itemType === "operation") {
                const { menuId, key } = node.operation;
                return {
                    ...node,
                    operation: {
                        menuId,
                        key
                    }
                };
            }
            if (node.itemType === "subMenu") {
                const childNodes = this.getViewMenuItemsDFS(node.subMenu);
                return {
                    ...node,
                    subMenu: childNodes
                };
            }
            return {
                ...node
            };
        });
        return newNodes;
    }

    /**
     * Return menu items that in payload format that will be rendered in UI.
     */
    getViewMenuItems() {
        return this.contextMenuItemsForView;
    }

    /**
     * Returns the args corresponding to the menu item selection.
     */
    computeArgsForMenuOperation(
        id: IOperationContextMenuItemIdentifier,
        dataFrame: IDataFrameHeader,
        selection: ISelection,
        getOperation: (operationKey: string) => IOperationView | undefined
    ) {
        const operation = getOperation(id.operationKey);
        let defaultArgs = {};
        if (operation) {
            defaultArgs = getDefaultArgs(
                dataFrame,
                operation.args,
                selection.columns.map((c) => dataFrame.columns[c.index])
            );
        }
        const foundNode = this.operationMenuItemCache[id.menuId ?? id.operationKey];
        if (foundNode) {
            return (
                foundNode.computeArgs?.({
                    selection,
                    defaultArgs
                }) ?? {}
            );
        }
        return {};
    }
}
