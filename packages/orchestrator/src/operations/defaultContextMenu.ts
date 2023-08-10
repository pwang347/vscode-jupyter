import { OperationContextMenuId } from "@dw/messaging";
import { OperationKey, ICreateOperationContextMenuContext, WranglerContextMenuItemWithArgs } from "./types";

/**
 * Returns the default context menu. Note that it's possible to return different menus depending on the engine type, as that is
 * also passed as part of the context.
 */
export function createDefaultContextMenu(ctx: ICreateOperationContextMenuContext): WranglerContextMenuItemWithArgs[] {
    return [
        {
            text: ctx.localizedStrings.OperationSortAscending,
            itemType: "operation",
            operation: {
                menuId: OperationContextMenuId.SortAscending,
                key: OperationKey.Sort,
                computeArgs: (ctx) => {
                    let args = { ...ctx.defaultArgs };
                    const columnTargets = [...ctx.selection.columns];
                    const firstColumn = columnTargets.shift();
                    if (firstColumn) {
                        args["TargetColumns"] = {
                            value: [firstColumn],
                            subMenu: {}
                        };
                        args["SortOrder"] = {
                            value: "ascending",
                            subMenu: {}
                        };
                    }
                    if (columnTargets.length > 0) {
                        args["AdditionalSortColumns"] = {
                            children: columnTargets.map((column) => ({
                                TargetColumns: {
                                    value: [column],
                                    subMenu: {}
                                },
                                SortOrder: {
                                    value: "ascending",
                                    subMenu: {}
                                }
                            }))
                        };
                    }
                    return args;
                }
            },
            targetFilter: {
                allowUnknownType: true,
                allowMixedType: true
            }
        },
        {
            text: ctx.localizedStrings.OperationSortDescending,
            itemType: "operation",
            operation: {
                menuId: OperationContextMenuId.SortDescending,
                key: OperationKey.Sort,
                computeArgs: (ctx) => {
                    let args = { ...ctx.defaultArgs };
                    const columnTargets = [...ctx.selection.columns];
                    const firstColumn = columnTargets.shift();
                    if (firstColumn) {
                        args["TargetColumns"] = {
                            value: [firstColumn],
                            subMenu: {}
                        };
                        args["SortOrder"] = {
                            value: "descending",
                            subMenu: {}
                        };
                    }
                    if (columnTargets.length > 0) {
                        args["AdditionalSortColumns"] = {
                            children: columnTargets.map((column) => ({
                                TargetColumns: {
                                    value: [column],
                                    subMenu: {}
                                },
                                SortOrder: {
                                    value: "descending",
                                    subMenu: {}
                                }
                            }))
                        };
                    }
                    return args;
                }
            },
            targetFilter: {
                allowUnknownType: true,
                allowMixedType: true
            }
        },
        {
            text: ctx.localizedStrings.OperationFilter,
            itemType: "operation",
            operation: {
                key: OperationKey.Filter,
                computeArgs: (ctx) => {
                    let args = { ...ctx.defaultArgs };
                    const columnTargets = [...ctx.selection.columns];
                    const firstColumn = columnTargets.shift();
                    if (firstColumn) {
                        args["TargetColumns"] = {
                            value: [firstColumn],
                            subMenu: {
                                TypedCondition: {
                                    Condition: {
                                        value: undefined,
                                        subMenu: {}
                                    }
                                }
                            }
                        };
                    }
                    if (columnTargets.length > 0) {
                        args["AdditionalConditions"] = {
                            children: columnTargets.map((column) => ({
                                Join: {
                                    value: "and",
                                    subMenu: {}
                                },
                                TargetColumns: {
                                    value: [column],
                                    subMenu: {
                                        TypedCondition: {
                                            Condition: {
                                                value: undefined,
                                                subMenu: {}
                                            }
                                        }
                                    }
                                }
                            }))
                        };
                    }
                    return args;
                }
            },
            targetFilter: {
                allowMixedType: true
            }
        },
        {
            itemType: "divider"
        },
        {
            text: ctx.localizedStrings.OperationRename,
            itemType: "operation",
            operation: {
                key: OperationKey.Rename,
                computeArgs: (ctx) => ({
                    ...ctx.defaultArgs,
                    TargetColumns: {
                        value: ctx.selection.columns,
                        subMenu: {}
                    }
                })
            },
            targetFilter: {
                isSingleTarget: true,
                allowUnknownType: true,
                allowMixedType: true
            }
        },
        {
            text: ctx.localizedStrings.OperationDrop,
            itemType: "operation",
            operation: {
                key: OperationKey.Drop,
                computeArgs: (ctx) => ({
                    ...ctx.defaultArgs,
                    TargetColumns: {
                        value: ctx.selection.columns,
                        subMenu: {}
                    }
                })
            },
            targetFilter: {
                allowUnknownType: true,
                allowMixedType: true
            }
        },
        {
            text: ctx.localizedStrings.OperationChangeType,
            itemType: "operation",
            operation: {
                key: OperationKey.ChangeType,
                computeArgs: (ctx) => ({
                    ...ctx.defaultArgs,
                    TargetColumns: {
                        value: ctx.selection.columns,
                        subMenu: {}
                    }
                })
            },
            targetFilter: {
                allowUnknownType: true,
                allowMixedType: true
            }
        }
    ];
}
