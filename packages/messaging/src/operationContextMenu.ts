import { ITargetFilter } from "./operations";

/**
 * Base payload for an operation menu item.
 */
export interface IBaseOperationMenuItemPayload {
    key: string;
    menuId?: string;
}

/**
 * Represents a context menu item associated with an operation.
 */
export interface IWranglerContextMenuOperationItem<
    TOperation extends IBaseOperationMenuItemPayload = IBaseOperationMenuItemPayload
> {
    text: string;
    itemType: "operation";
    targetFilter?: ITargetFilter;
    operation: TOperation;
}

/**
 * Represents a context menu item with a submenu.
 */
export interface IWranglerContextMenuSubMenuItem<TMenuItemType> {
    text: string;
    itemType: "subMenu";
    subMenu: Array<TMenuItemType>;
}

/**
 * Represents a context menu item that is a divider.
 */
export interface IWranglerContextMenuDividerItem {
    itemType: "divider";
}

/**
 * Context menu item type.
 */
export type WranglerContextMenuItem<TOperation extends IBaseOperationMenuItemPayload = IBaseOperationMenuItemPayload> =
    | IWranglerContextMenuOperationItem<TOperation>
    | IWranglerContextMenuSubMenuItem<WranglerContextMenuItem<TOperation>>
    | IWranglerContextMenuDividerItem;

/**
 * Identifier used for operation context menu items.
 */
export interface IOperationContextMenuItemIdentifier {
    operationKey: string;
    menuId?: string;
}

/**
 * Known context menu identifiers.
 */
export enum OperationContextMenuId {
    SortDescending = "sortDescending",
    SortAscending = "sortAscending"
}
