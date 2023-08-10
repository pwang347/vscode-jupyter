import {
    IBaseOperationMenuItemPayload,
    IResolvedPackageDependencyMap,
    ISelection,
    IWranglerContextMenuOperationItem,
    WranglerContextMenuItem
} from "@dw/messaging";
import { IWranglerEngine } from "../../engines";
import { LocalizedStrings } from "../../localization";

/**
 * Context used to generate arguments from menu.
 */
export interface IOperationContextMenuItemComputeArgsContext {
    selection: ISelection;
    defaultArgs: any;
}

/**
 * Payload for context menu operation items.
 */
export interface IOperationMenuItemPayload extends IBaseOperationMenuItemPayload {
    // TODO@DW: when we add support for PySpark, we might want to consider strongly typing the arguments here as well if we decide that all operations across engines must share the same payloads
    computeArgs?: (context: IOperationContextMenuItemComputeArgsContext) => any;
}

/**
 * Operation menu item with added args property.
 */
export interface IWranglerContextMenuOperationItemWithArgs
    extends IWranglerContextMenuOperationItem<IOperationMenuItemPayload> {}

/**
 * Context menu item with additional parameter to provide a way to compute the args based on UI context.
 */
export type WranglerContextMenuItemWithArgs = WranglerContextMenuItem<IOperationMenuItemPayload>;

/**
 * Context used to create the operation context menu.
 */
export interface ICreateOperationContextMenuContext {
    engine: IWranglerEngine;
    dependencies: IResolvedPackageDependencyMap;
    localizedStrings: typeof LocalizedStrings.Orchestrator;
}
