// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";

import { IMessageHandler } from '../react-common/postOffice';
import { OperationKey, OperationContextMenuId, ColumnType,  IDataFrame } from "@dw/messaging";
import {
    ReactDataGrid,
    LocalizedStrings,
    HeaderLabelType,
    GridCellIcon,
    CellContextMenuGridOperations,
    IVisualizationStyle
} from "@dw/components";
import "@dw/components/dist/index.css";
import "./dataWranglerPanel.css";

import visualizationRenderers from "@dw/visualization-recharts";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import { Shimmer, ShimmerElementType } from "@fluentui/react/lib/Shimmer";
import { Icon } from "@fluentui/react/lib/Icon";
import { ContextualMenu, DirectionalHint, ContextualMenuItemType } from "@fluentui/react/lib/ContextualMenu";
import { IContextualMenuItemProps, IContextualMenuItemRenderFunctions, IconButton, TextField, initializeIcons } from '@fluentui/react';
import { DataWranglerMessages } from '../../extension-side/dataviewer/dataWranglerMessages';
import { WranglerPostOffice } from './wranglerPostOffice';
import {FilterAscendingIcon, FilterDescendingIcon} from "@fluentui/react-icons-mdl2";
import { registerIcons } from '@fluentui/react/lib/Styling';

initializeIcons(); // Register all FluentUI icons being used to prevent developer console errors
registerIcons({
    icons: {
        FilterAscending: <FilterAscendingIcon />,
        FilterDescending: <FilterDescendingIcon />
    }
})

const loadingShimmer = [{ type: ShimmerElementType.line, height: 10 }];
const loadingShimmerColors = {
    shimmer: "var(--theme-wrangler-grid-header-cell-default-hover-bg)",
    shimmerWave: "var(--theme-wrangler-grid-cell-default-column-selected-hover-bg)"
};

const visualizationStyle: IVisualizationStyle = {
    primaryColor: "var(--vscode-charts-blue)",
    secondaryColor: "var(--vscode-charts-purple)",
    outlinesOnly: false,
    backgroundColor: "var(--theme-wrangler-grid-cell-default-bg)",
    foregroundColor: "var(--theme-wrangler-grid-cell-default-fg)"
};

interface IGridPanelState {
    dataFrame: IDataFrame | undefined
}

/**
 * A panel containing the data wrangler grid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GridPanel extends React.PureComponent<any, IGridPanelState> implements IMessageHandler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMessage(type: string, payload?: any): boolean {
        switch (type) {
            case DataWranglerMessages.Host.InitializeData:
                this.setState({
                    dataFrame: this.postOffice.linkDataFrame(payload),
                });
                break;
            case DataWranglerMessages.Host.SetDataFrame:
                this.setState({
                    dataFrame: this.postOffice.linkDataFrame(payload),
                })
                break;
        }
        return true;
    }
    dispose?(): void {
        throw new Error('Method not implemented.');
    }
    private postOffice: WranglerPostOffice = new WranglerPostOffice();

    // private gridRef = React.createRef<ReactDataGrid>();
    override state: IGridPanelState = {
        dataFrame: undefined
    }

    override componentDidMount(): void {
        this.postOffice.addHandler(this);
        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.Started);
    }

    override render() {
        return <div style={{height: "100%", width: "100%"}}>
            {!this.state.dataFrame && "Loading..."}
            <ReactDataGrid
        // ref={this.gridRef}
        comms={this.postOffice}
        operations={[]}
        operationContextMenu={[]}
        locale="en" // TODO@DW: localize
        localizedStrings={LocalizedStrings.Grid}
        visualizationLocalizedStrings={LocalizedStrings.Visualization}
        gridCellEdits={[]}
        dataFrame={this.state.dataFrame}
        historyItems={[]}
        activeHistoryDataFrame={this.state.dataFrame}
        disableInteractions={false}
        disableFetching={false}
        disableCommitButton={true}
        enableEditLastAppliedOperation={false}
        renderers={{
            onRenderCellIcon: (props) => {
                return (
                    <TooltipHost content={props.iconTooltipText}>
                        {props.cellIcon === GridCellIcon.EditSuccess ? (
                            <span
                                style={{ color: "var(--vscode-debugIcon-startForeground)" }}
                                className="codicon codicon-check"
                            />
                        ) : props.cellIcon === GridCellIcon.EditFail ? (
                            <span
                                style={{ color: "var(--vscode-errorForeground)" }}
                                className="codicon codicon-error"
                            />
                        ) : (
                            <span
                                style={{ color: "var(--vscode-breadcrumb-foreground)" }}
                                className="codicon codicon-question"
                            />
                        )}
                    </TooltipHost>
                );
            },
            onRenderLoadingCell: () => {
                return (
                    <Shimmer
                        shimmerElements={loadingShimmer}
                        shimmerColors={loadingShimmerColors}
                    />
                );
            },
            onRenderHeaderLabel: (props) => {
                let icon = null;
                if (props.labelType === HeaderLabelType.Added) {
                    // [+] icon
                    icon = (
                        // TODO@DW: localize
                        <TooltipHost
                            styles={{root: { display: "flex" }}}
                            content={"This column will be added"}
                        >
                            <Icon iconName="ExploreContentSingle" />
                        </TooltipHost>
                    );
                } else if (props.labelType === HeaderLabelType.Removed) {
                    // [-] icon
                    icon = (
                        // TODO@DW: localize
                        <TooltipHost
                        styles={{root: { display: "flex" }}}
                        content={"This column will be removed"}
                        >
                            <Icon iconName="CollapseContentSingle" />
                        </TooltipHost>
                    );
                }
                let dataTypeIconName;
                switch (props.dataType) {
                    case ColumnType.Integer:
                    case ColumnType.Float:
                    case ColumnType.Complex:
                        dataTypeIconName = "NumberSymbol";
                        break;
                    case ColumnType.Boolean:
                        dataTypeIconName = "ToggleLeft";
                        break;
                    case ColumnType.Datetime:
                    case ColumnType.Timedelta:
                        dataTypeIconName = "DateTime";
                        break;
                    case ColumnType.String:
                        dataTypeIconName = "InsertTextBox";
                        break;
                    case ColumnType.Category:
                    case ColumnType.Interval:
                    case ColumnType.Period:
                    case ColumnType.Unknown:
                    default:
                        dataTypeIconName = "CubeShape";
                        break;
                }
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                        {icon}
                        <TooltipHost content={props.rawDataType}>
                            <Icon iconName={dataTypeIconName} />
                        </TooltipHost>
                        <TooltipHost content={props.label}>
                            <div style={{ textOverflow: "ellipsis", overflow: "hidden" }}>
                                {props.label}
                            </div>
                        </TooltipHost>
                    </div>
                );
            },
            onRenderCommitButton: (props) => {
                return <button
                        disabled={props.disabled}
                        style={{
                            color: "unset",
                            backgroundColor: props.disabled ? "unset" : undefined,
                            cursor: props.disabled ? "default" : undefined,
                            marginTop: 1,
                            paddingBottom: 1
                        }}
                        className="wrangler-column-header-button"
                        // iconProps={{ iconName: "CheckMark" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onClick();
                            // this.setState({
                            //     operationCompletionPending: true
                            // });
                        }}
                    />
            },
            onRenderOverflowMenuButton: (props) => {
                let iconName = "More";
                let className = "wrangler-column-header-button";
                if (props.sortAsc === true) {
                    if (props.filter) {
                        iconName = "FilterAscending";
                    } else {
                    iconName = "SortUp";
                    }
                } else if (props.sortAsc === false) {
                    if (props.filter) {
                        iconName = "FilterDescending";
                    } else {
                        iconName = "SortDown";
                    }
                } else {
                    if (props.filter) {
                        iconName = "Filter";
                    } else {
                    className += " wrangler-column-header-overflow-menu";
                    }
                }
                return (
                    <IconButton
                        style={{ color: "unset" }}
                        className={className}
                        iconProps={{ iconName }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            props.showHeaderContextMenu(e.target as any);
                        }}
                    />
                );
            },
            onRenderOperationContextMenuItem: (props) => {
                const baseProps = {
                    key: props.key,
                    title: props.disabledReason,
                    disabled: props.disabledReason !== undefined,
                    onClick: props.onClick
                };
                if (props.menuItem.itemType === "divider") {
                    return {
                        ...baseProps,
                        itemType: ContextualMenuItemType.Divider
                    };
                }
                if (props.menuItem.itemType === "subMenu") {
                    return {
                        ...baseProps,
                        text: props.menuItem.text,
                        subMenuProps: {
                            items: props.renderSubMenu(props.menuItem.subMenu)
                        }
                    };
                }
                return {
                    ...baseProps,
                    text: props.menuItem.text,
                    iconProps: {
                        text: props.menuItem.text,
                        iconName: this.getContextMenuIconName(
                            props.menuItem.operation.key,
                            props.menuItem.operation.menuId
                        )
                    }
                };
            },
            onRenderHeaderContextMenu: (props) => {
                return (
                    <ContextualMenu
                        onDismiss={props.dismiss}
                        target={props.target}
                        items={[...props.operationContextMenuItems, ...props.gridOperations.map((o) => {
                            if (o.type === "divider") {
                                return {
                                    itemType: ContextualMenuItemType.Divider
                                }
                            }
                            if (o.type === "textField") {
                                return {
                                    key: o.key,
                                    text: o.label,
                                    iconProps: {
                                        iconName: this.getContextMenuIconName(o.key)
                                    },
                                    onRender: (item: any, dismissMenu: (ev?: any, dismissAll?: boolean) => void) => {
                                        return <div style={{margin: 10}}>
                                            <div style={{marginBottom: 10, display: "flex", alignItems: "center", gap: 5}}>
                                            <Icon iconName='Filter' />Filter
                                            </div><TextField defaultValue={o.filter} onChange={(_, newValue) => {
                                            o.onFilterChange(newValue ?? "");
                                        }} /></div>
                                    }
                                }
                            }
                            return {
                                key: o.key,
                                text: o.label,
                                onClick: this.getGridOperationOnClick(o.key, o.onClick),
                                iconProps: {
                                    iconName: this.getContextMenuIconName(o.key)
                                }
                            };
                        })]}
                        directionalHint={DirectionalHint.bottomRightEdge}
                    />
                );
            },
            onRenderCellContextMenu: (props) => {
                return (
                    <ContextualMenu
                        onDismiss={props.dismiss}
                        target={props.target}
                        items={[
                            ...props.gridOperations.map((o) => {
                                return {
                                    key: o.key,
                                    text: o.label,
                                    onClick: this.getGridOperationOnClick(o.key, o.onClick),
                                    iconProps: {
                                        iconName: this.getContextMenuIconName(o.key)
                                    }
                                };
                            })
                        ]}
                        directionalHint={DirectionalHint.bottomLeftEdge}
                    />
                );
            },
            ...visualizationRenderers
        }}
        visualizationStyle={visualizationStyle}
    />
    </div>
    }

    private getContextMenuIconName(key: string, menuId?: string) {
        if (key === "clear") {
            return "Clear";
        }
        if (menuId === OperationContextMenuId.SortAscending || key === "sortAsc") {
            return "Ascending";
        } else if (menuId === OperationContextMenuId.SortDescending || key === "sortDesc") {
            return "Descending";
        } else if (key === OperationKey.Filter || key === "filter") {
            return "Filter";
        } else if (key === CellContextMenuGridOperations.CopyCell || key === CellContextMenuGridOperations.CopyRows) {
            return "Copy";
        }
        return "";
    }

    private getGridOperationOnClick(key: string, onClick: () => void) {
        if (key === CellContextMenuGridOperations.CopyCell) {
            return () => {
                // TODO
                onClick();
            };
        }
        if (key === CellContextMenuGridOperations.CopyRows) {
            return () => {
                // TODO
                onClick();
            };
        }
        return onClick;
    }
}
