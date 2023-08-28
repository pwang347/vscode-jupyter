// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";

import { IMessageHandler } from '../react-common/postOffice';
import { OperationKey, OperationContextMenuId, ColumnType,  IDataFrame, IOperationView, IArgLayoutHint, getDefaultArgs } from "@dw/messaging";
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
import "./fluentOverrides.css";

import visualizationRenderers from "@dw/visualization-recharts";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import { Shimmer, ShimmerElementType } from "@fluentui/react/lib/Shimmer";
import { Icon } from "@fluentui/react/lib/Icon";
import { ContextualMenu, DirectionalHint, ContextualMenuItemType } from "@fluentui/react/lib/ContextualMenu";
import { IconButton, Label, Position, SelectableOptionMenuItemType, SpinButton, TextField, VirtualizedComboBox, initializeIcons } from '@fluentui/react';
import { DataWranglerMessages } from '../../extension-side/dataviewer/dataWranglerMessages';
import { WranglerPostOffice } from './wranglerPostOffice';
import {FilterAscendingIcon, FilterDescendingIcon} from "@fluentui/react-icons-mdl2";
import { registerIcons } from '@fluentui/react/lib/Styling';
import { VSCodeCheckbox, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import {IFilterOperationArgs } from "@dw/engines/lib/core/operations/filter";
import {ISortOperationArgs } from "@dw/engines/lib/core/operations/sort";
import { renderOperationPanelArguments } from "@dw/components";
import { Callout } from "@fluentui/react/lib/Callout";
import { IFloatFieldProps, IIntegerFieldProps, IOperationsPanelArgumentRenderers } from '@dw/components/dist/panels/operations/types';
// eslint-disable-next-line no-restricted-imports
import { debounce } from 'lodash';

initializeIcons(); // Register all FluentUI icons being used to prevent developer console errors
registerIcons({
    icons: {
        FilterAscending: <FilterAscendingIcon />,
        FilterDescending: <FilterDescendingIcon />
    }
})

const toolbarHeight = "31px";

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
    originalDataFrame: IDataFrame | undefined;
    dataFrame: IDataFrame | undefined;
    filterVisible: boolean;
    sortVisible: boolean;
    filterArgs: IFilterOperationArgs | undefined;
    sortArgs: ISortOperationArgs | undefined;
    operations: IOperationView[];
}

/**
 * A panel containing the data wrangler grid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GridPanel extends React.PureComponent<any, IGridPanelState> implements IMessageHandler {
    private gridRef = React.createRef<ReactDataGrid>();

    countSortTargets = () => {
        let sortTargets = 0;
        sortTargets += this.state.sortArgs?.TargetColumns.value.length ?? 0;
        for (const sortColumn of this.state.sortArgs?.AdditionalSortColumns.children ?? []) {
            sortTargets += sortColumn.TargetColumns.value.length;
        }
        return sortTargets;
    }

    countFilterTargets = () => {
        let filterTargets = 0;
        filterTargets += this.state.filterArgs?.TargetColumns.value.length ?? 0;
        for (const filterColumn of this.state.filterArgs?.AdditionalConditions.children ?? []) {
            filterTargets += filterColumn.TargetColumns.value.length;
        }
        return filterTargets;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMessage(type: string, payload?: any): boolean {
        switch (type) {
            case DataWranglerMessages.Host.InitializeData:
                const dataFrame = this.postOffice.linkDataFrame(payload);
                const sortArgs = getDefaultArgs(
                    dataFrame,
                    this.state.operations.find((operation) => operation.key === OperationKey.Sort)?.args ?? [],
                    []
                );
                const filterArgs = getDefaultArgs(
                    dataFrame,
                    this.state.operations.find((operation) => operation.key === OperationKey.Filter)?.args ?? [],
                    []
                );
                this.setState({
                    originalDataFrame: this.state.originalDataFrame ?? dataFrame,
                    dataFrame,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    sortArgs: sortArgs as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    filterArgs: filterArgs as any
                });
                break;
            case DataWranglerMessages.Host.SetDataFrame:
                const dataFrame2 = this.postOffice.linkDataFrame(payload);
                const sortArgs2 = this.state.sortArgs ?? getDefaultArgs(
                    dataFrame2,
                    this.state.operations.find((operation) => operation.key === OperationKey.Sort)?.args ?? [],
                    []
                );
                const filterArgs2 = this.state.filterArgs ?? getDefaultArgs(
                    dataFrame2,
                    this.state.operations.find((operation) => operation.key === OperationKey.Filter)?.args ?? [],
                    []
                );
                this.setState({
                    originalDataFrame: this.state.originalDataFrame ?? dataFrame2,
                    dataFrame: dataFrame2,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    sortArgs: sortArgs2 as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    filterArgs: filterArgs2 as any
                })
                break;
            case DataWranglerMessages.Host.RevealColumn:
                void this.gridRef.current?.scrollToColumn(payload.columnIndex);
                break;
            case DataWranglerMessages.Host.SetOperations:
                this.setState({
                    operations: payload.operations
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
        originalDataFrame: undefined,
        dataFrame: undefined,
        filterVisible: false,
        sortVisible: false,
        filterArgs: undefined,
        sortArgs: undefined,
        operations: []
    }

    override componentDidMount(): void {
        this.postOffice.addHandler(this);
        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.Started);
    }

    private renderToolbar() {
        const { dataFrame } =
            this.state;
        const noDataFrame = !dataFrame;

        // TODO@DW: localize
        const askToPerformOperationDataFrame = (message: string) =>
            noDataFrame ? "Data must be loaded first" : message;

        return (
            <div
                style={{
                    display: "flex",
                    height: toolbarHeight
                }}
            >
                <VSCodeButton
                    appearance="secondary"
                    className="gridPanel-toolbar-vscode-button"
                    onClick={() => {
                        this.setState({
                            sortArgs: undefined,
                            filterArgs: undefined,
                            sortVisible: false,
                            filterVisible: false
                        })
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RefreshData);
                    }}
                    disabled={noDataFrame}
                    title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Refresh data")}
                >
                    {/* TODO@DW:localize */}
                    Refresh
                    <span slot="start" className="codicon codicon-refresh" />
                </VSCodeButton>
                <VSCodeButton
                    id="filter-button"
                    appearance="secondary"
                    className="gridPanel-toolbar-vscode-button"
                    onClick={() => {
                        if (this.state.filterVisible) {
                            return;
                        }
                        this.setState({
                            filterVisible: true,
                            sortVisible: false
                        })
                    }}
                    disabled={noDataFrame}
                    title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Filter")}
                >
                    {/* TODO@DW:localize */}
                    {this.countFilterTargets() > 0 ? `Filter (${this.countFilterTargets()})` : "Filter"}
                    <span slot="start" className="codicon codicon-filter" />
                </VSCodeButton>
                <VSCodeButton
                    id="sort-button"
                    appearance="secondary"
                    className="gridPanel-toolbar-vscode-button"
                    onClick={() => {
                        if (this.state.sortVisible) {
                            return;
                        }
                        this.setState({
                            sortVisible: true,
                            filterVisible: false
                        })
                    }}
                    disabled={noDataFrame}
                    title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Sort")}
                >
                    {/* TODO@DW:localize */}
                    {this.countSortTargets() > 0 ? `Sort (${this.countSortTargets()})` : "Sort"}
                    <span slot="start" className="codicon codicon-sort-precedence" />
                </VSCodeButton>
                <VSCodeButton
                    appearance="secondary"
                    className="gridPanel-toolbar-vscode-button"
                    onClick={() => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ToggleSummary);
                    }}
                    disabled={noDataFrame}
                    title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Summary")}
                >
                    {/* TODO@DW:localize */}
                    Summary
                    <span slot="start" className="codicon codicon-list-flat" />
                </VSCodeButton>
                    <VSCodeButton
                        appearance="secondary"
                        className="gridPanel-toolbar-vscode-button"
                        onClick={async () => {
                            this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ExportData);
                        }}
                        disabled={noDataFrame}
                        title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Export data")}
                    >
                        {/* TODO@DW:localize */}
                        Export data
                        <span slot="start" className="codicon codicon-table"></span>
                    </VSCodeButton>
                    <VSCodeButton
                    appearance="secondary"
                    className="gridPanel-toolbar-vscode-button"
                    onClick={() => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RevealColumn);
                    }}
                    disabled={noDataFrame}
                    title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Go to column")}
                >
                    {/* TODO@DW:localize */}
                    Go to column
                    <span slot="start" className="codicon codicon-search" />
                </VSCodeButton>
            </div>
        );
    }

    renderSort() {
        if (!this.state.sortVisible) {
            return null;
        }

        return <Callout target={'#sort-button'} role="dialog"
        preventDismissOnEvent={(e) => {
            return e.type !== "click"}
        }
        isBeakVisible={false}
        gapSpace={0} onDismiss={() => {
            this.setState({
                sortVisible: false
            })
        }}><div style={{padding: 20}}><div style={{position: "absolute", right: 0, top: 0}}><VSCodeButton
        id="filter-button"
        appearance="secondary"
        className="gridPanel-toolbar-vscode-button"
        onClick={() => {
            this.setState({
                sortArgs: getDefaultArgs(
                    this.state.dataFrame!,
                    this.state.operations.find((operation) => operation.key === OperationKey.Sort)?.args ?? [],
                    []
                ) as any
            }, () => {
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
            })
        }}
        title={"Clear"}
    >
        {/* TODO@DW:localize */}
        Clear
        <span slot="start" className="codicon codicon-clear-all" />
    </VSCodeButton></div>{renderOperationPanelArguments({
            comms: this.postOffice,
            operations: [],
            gridCellEdits: [],
            gridSelection: { columns: [], rows: [], isEntireTableSelected: false},
            historyItems: [],
            enableAutomaticCodeExecutionForDescribeOp: false,
            enableEditLastAppliedOperation: false,
            renderers: this.renderers,
            dataFrameHeader: this.state.originalDataFrame,
            activeHistoryDataFrameHeader: this.state.originalDataFrame
        }, {
            searchValue: "",
            isWaitingForPreview: false,
            selectedArgs: this.state.sortArgs ?? {},
            selectedOperation: this.state.operations.find((operation) => operation.key === OperationKey.Sort),
            activeDataFrameHeader: this.state.originalDataFrame
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, (newState: any) => {
            this.setState({
                sortArgs: newState.selectedArgs
            }, () => {
                console.log("@@PREVIEW", {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                } )
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
            })

        }, () => {
            //
        }, LocalizedStrings.Operations, this.renderers
        )}</div>
        </Callout>
    }

    renderFilter() {
        if (!this.state.filterVisible) {
            return null;
        }

        return <Callout target={'#filter-button'} role="dialog"
        preventDismissOnEvent={(e) => {
            return e.type !== "click"}
        }
        isBeakVisible={false}
        gapSpace={0} onDismiss={() => {
            this.setState({
                filterVisible: false
            })
        }}><div style={{padding: 20}}><div style={{position: "absolute", right: 0, top: 0}}><VSCodeButton
        id="filter-button"
        appearance="secondary"
        className="gridPanel-toolbar-vscode-button"
        onClick={() => {
            this.setState({
                filterArgs: getDefaultArgs(
                    this.state.dataFrame!,
                    this.state.operations.find((operation) => operation.key === OperationKey.Filter)?.args ?? [],
                    []
                ) as any
            }, () => {
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
            })
        }}
        title={"Clear"}
    >
        {/* TODO@DW:localize */}
        Clear
        <span slot="start" className="codicon codicon-clear-all" />
    </VSCodeButton></div>{renderOperationPanelArguments({
            comms: this.postOffice,
            operations: [],
            gridCellEdits: [],
            gridSelection: { columns: [], rows: [], isEntireTableSelected: false},
            historyItems: [],
            enableAutomaticCodeExecutionForDescribeOp: false,
            enableEditLastAppliedOperation: false,
            renderers: this.renderers,
            dataFrameHeader: this.state.originalDataFrame,
            activeHistoryDataFrameHeader: this.state.originalDataFrame
        }, {
            searchValue: "",
            isWaitingForPreview: false,
            selectedArgs: this.state.filterArgs ?? {},
            selectedOperation: this.state.operations.find((operation) => operation.key === OperationKey.Filter),
            activeDataFrameHeader: this.state.originalDataFrame
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, (newState: any) => {
            this.setState({
                filterArgs: newState.selectedArgs
            }, () => {
                console.log("@@PREVIEW", {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                } )
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
            })
        }, () => {
            console.log("@@@PREVIEW");
        }, LocalizedStrings.Operations, this.renderers)}</div>
        </Callout>
    }

    override render() {
        return                 <div
        style={{
            display: "flex",
            flexDirection: "column"
        }}
    >
        {this.renderToolbar()}
        {this.renderFilter()}
        {this.renderSort()}
        <div
            style={{
                // Note: it's necessary to specify an exact height like this so that virtualization works
                // correctly in react-data-grid.
                // This is doing the calculation in CSS directly, which assumes that the toolbar will always
                // be enabled. If we ever decide to have the ability to disable the toolbar, we'll need to set
                // this height programmatically. See notebookEditorWidget.ts in microsoft/vscode GitHub repo
                // for inspiration.
                height: `calc(100vh - ${toolbarHeight})`
            }}
        >
            {!this.state.dataFrame && <div style={{margin: "auto", height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}><h3>Loading...</h3><VSCodeProgressRing /></div>}
            {true && <ReactDataGrid
        ref={this.gridRef}
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
        disableInteractions={true}
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
                                    onRender: () => {
                                        return <div style={{margin: 10, color: "var(--vscode-foreground)"}}>
                                            <div style={{marginBottom: 10, display: "flex", alignItems: "center", gap: 5}}>
                                            <Icon iconName='Filter' />Filter
                                            </div><TextField style={{color: "var(--vscode-foreground)"}} defaultValue={o.filter} onChange={(_, newValue) => {
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
    />}
    </div>
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

    private renderers: IOperationsPanelArgumentRenderers = {
        onRenderArgGroupField: (props) => {
            return (
                <ArgFieldWithErrorLabel key={props.key} errorMessage={props.errorMessage}>
                    <div style={{ minHeight: 10 }}>
                        {props.subMenuArgs.map((subMenuArg, idx) => {
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap-reverse",
                                        border: "thin solid var(--vscode-dropdown-border)",
                                        borderRadius: 4,
                                        padding: 10,
                                        marginTop: 10,
                                        marginBottom: 10
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexFlow: "row wrap",
                                            flexGrow: 1,
                                            flexBasis: 0,
                                            gap: 4,
                                            marginRight: 8,
                                            // maxWidth: "100%"
                                        }}
                                    >
                                        {subMenuArg}
                                    </div>
                                    <VSCodeButton
                                        // TODO@DW: localize
                                        title="Delete"
                                        className="operation-arg-group-delete-button"
                                        disabled={props.disabled}
                                        onClick={() => {
                                            if (!props.disabled) {
                                                props.onDeleteGroupButtonClick(idx);
                                            }
                                        }}
                                    >
                                        <span className="codicon codicon-trash"></span>
                                    </VSCodeButton>
                                </div>
                            );
                        })}
                    </div>
                    <VSCodeButton
                        appearance="secondary"
                        disabled={props.disabled}
                        onClick={() => {
                            if (!props.disabled) {
                                props.onAddGroupButtonClick();
                            }
                        }}
                    >
                        {props.addGroupLabel}
                        <span slot="start" className="codicon codicon-add"></span>
                    </VSCodeButton>
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderTargetField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    {props.multiSelect ? (
                        <VirtualizedComboBox
                            calloutProps={{
                                directionalHintFixed: true
                            }}
                            useComboBoxAsMenuWidth={true}
                            label={props.label}
                            multiSelect={true}
                            allowFreeform={true}
                            options={[
                                {
                                    key: "all",
                                    // TODO@DW: localize
                                    text: "Select all",
                                    // itemType: SelectableOptionMenuItemType.SelectAll,
                                    disabled: props.disableSelectAll,
                                    // TODO@DW: localize
                                    title: props.disableSelectAll
                                        ? "Cannot select all with different column types"
                                        : "Select all"
                                },
                                {
                                    key: "divider",
                                    text: "",
                                    itemType: SelectableOptionMenuItemType.Divider
                                }
                            ].concat(
                                props.choices.map(
                                    (c) =>
                                        ({
                                            key: "column" + c.key,
                                            text: c.label,
                                            disabled: c.disabledReason !== undefined,
                                            title: c.disabledReason ?? c.label
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        } as any)
                                )
                            )}
                            // TODO@DW: localize
                            placeholder={"Select one or more target columns..."}
                            selectedKey={
                                props.selectedColumnNames.length ===
                                props.choices.filter((c) => c.disabledReason === undefined).length
                                    ? ["all"].concat(props.selectedColumnNames.map((c) => "column" + c))
                                    : props.selectedColumnNames.map((c) => "column" + c)
                            }
                            disabled={props.disabled}
                            onChange={(e, option) => {
                                // Ignore onChange events which are triggered when the columns dropdown loses focus.
                                // This happens only when you use keyboard in the dropdown.
                                if (e.type === "blur") return;
                                let selected = props.selectedColumnNames;
                                if (option?.selected) {
                                    if (option.key === "all") {
                                        selected = props.choices
                                            .filter((c) => c.disabledReason === undefined)
                                            .map((c) => {
                                                return c.key as string;
                                            });
                                    } else {
                                        const optionKey = (option.key as string).substring(
                                            "column".length
                                        );
                                        selected = selected
                                            .filter((s) => s !== optionKey)
                                            .concat([optionKey]);
                                    }
                                } else {
                                    if (option?.key === "all") {
                                        selected = [];
                                    } else if (option) {
                                        const optionKey = (option.key as string).substring(
                                            "column".length
                                        );
                                        selected = selected.filter((s) => s !== optionKey);
                                    }
                                }
                                props.onChange(selected);
                            }}
                            styles={{
                                root: {
                                    selectors: {
                                        "::after": {
                                            borderColor: "var(--vscode-dropdown-border) !important"
                                        }
                                    }
                                },
                                rootHovered: {
                                    selectors: {
                                        "::after": {
                                            borderColor: "var(--vscode-dropdown-border) !important"
                                        }
                                    }
                                },
                                rootFocused: {
                                    selectors: {
                                        "::after": {
                                            // borderColor: fluentTheme.palette?.themePrimary
                                        }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <VirtualizedComboBox
                            calloutProps={{
                                directionalHintFixed: true
                            }}
                            useComboBoxAsMenuWidth={true}
                            label={props.label}
                            multiSelect={false}
                            allowFreeform={true}
                            options={props.choices.map((c) => ({
                                key: c.key,
                                text: c.label,
                                disabled: c.disabledReason !== undefined,
                                title: c.disabledReason ?? c.label
                            }))}
                            // TODO@DW: localize
                            placeholder={"Select a target column..."}
                            // note: null is required to clear the value
                            selectedKey={props.selectedColumnNames[0] ?? null}
                            disabled={props.disabled}
                            onChange={(_, option) => {
                                if (option) {
                                    const optionKey = option.key as string;
                                    props.onChange([optionKey]);
                                }
                            }}
                            styles={{
                                root: {
                                    selectors: {
                                        "::after": {
                                            borderColor: "var(--vscode-dropdown-border)"
                                        }
                                    }
                                },
                                rootHovered: {
                                    selectors: {
                                        "::after": {
                                            borderColor: "var(--vscode-dropdown-border)"
                                        }
                                    }
                                },
                                rootFocused: {
                                    selectors: {
                                        "::after": {
                                            // borderColor: fluentTheme.palette?.themePrimary
                                        }
                                    }
                                }
                            }}
                        />
                    )}
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderBooleanField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <VSCodeCheckbox
                        onChange={(e) => {
                            props.onChange(!!(e.target as HTMLInputElement).checked);
                        }}
                        disabled={props.disabled}
                        checked={props.value}
                    >
                        {props.label}
                    </VSCodeCheckbox>
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderCategoryField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <VirtualizedComboBox
                        calloutProps={{
                            directionalHintFixed: true
                        }}
                        useComboBoxAsMenuWidth={true}
                        label={props.label}
                        allowFreeform={true}
                        options={props.choices.map((c) => ({
                            key: c.key,
                            text: c.label,
                            title: c.label
                        }))}
                        disabled={props.disabled}
                        placeholder={props.placeholder}
                        // note: null is required to clear the value
                        selectedKey={props.value ?? null}
                        onChange={(_, option) => {
                            if (option) {
                                props.onChange(option.key as string);
                            }
                        }}
                        styles={{
                            root: {
                                selectors: {
                                    "::after": {
                                        borderColor: "var(--vscode-dropdown-border)"
                                    }
                                }
                            },
                            rootHovered: {
                                selectors: {
                                    "::after": {
                                        borderColor: "var(--vscode-dropdown-border)"
                                    }
                                }
                            },
                            rootFocused: {
                                selectors: {
                                    "::after": {
                                        // borderColor: fluentTheme.palette?.themePrimary
                                    }
                                }
                            }
                        }}
                    />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderDatetimeField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <TextField value={props.value} onChange={(e) => {
                        props.onChange((e.target as HTMLInputElement).value);
                    }} />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderFloatField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <SpinButton
                        label={props.label}
                        labelPosition={Position.top}
                        value={props.value.toString()}
                        step={props.step || 0.1}
                        min={props.minValue}
                        max={props.maxValue}
                        inputProps={{ size: 1 }}
                        disabled={props.disabled}
                        // see https://github.com/microsoft/fluentui/issues/5326
                        onKeyDown={(e) => {
                            let target = e.target as HTMLInputElement;
                            this.handleFloatKeyDown(target, props);
                        }}
                        onChange={(newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(parseFloat((newValue.target as HTMLInputElement).value));
                            }
                        }}
                        onIncrement={(value) => {
                            if (value !== undefined) {
                                props.onChange(parseFloat(value) + 1);
                            }
                        }}
                        onDecrement={(value) => {
                            if (value !== undefined) {
                                props.onChange(parseFloat(value) - 1);
                            }
                        }}
                        styles={{
                            spinButtonWrapper: {
                                selectors: {
                                    "::after": {
                                        borderColor: "var(--vscode-dropdown-border)"
                                    },
                                    ":hover::after": {
                                        borderColor: "var(--vscode-dropdown-border)"
                                    }
                                }
                            }
                        }}
                    />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderIntegerField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <SpinButton
                        label={props.label}
                        labelPosition={Position.top}
                        value={props.value.toString()}
                        step={props.step}
                        min={props.minValue}
                        max={props.maxValue}
                        inputProps={{ size: 1 }}
                        disabled={props.disabled}
                        // see https://github.com/microsoft/fluentui/issues/5326
                        onKeyDown={(e) => {
                            let target = e.target as HTMLInputElement;
                            this.handleIntKeyDown(target, props);
                        }}
                        onIncrement={(value) => {
                            if (value !== undefined) {
                                props.onChange(parseInt(value, 10) + 1);
                            }
                        }}
                        onDecrement={(value) => {
                            if (value !== undefined) {
                                props.onChange(parseInt(value, 10) - 1);
                            }
                        }}
                        onChange={(newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(parseInt((newValue.target as HTMLInputElement).value, 10));
                            }
                        }}
                        styles={{
                            spinButtonWrapper: {
                                selectors: {
                                    "::after": {
                                        borderColor: "var(--vscode-dropdown-border) !important"
                                    },
                                    ":hover::after": {
                                        borderColor: "var(--vscode-dropdown-border) !important"
                                    }
                                }
                            }
                        }}
                    />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderStringField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <TextField value={props.value} onChange={(e) => {
                        props.onChange((e.target as HTMLInputElement).value);
                    }} />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderTimedeltaField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <SpinButton
                        label={props.label}
                        labelPosition={Position.top}
                        value={props.value.toString()}
                        inputProps={{size: 1}}
                        disabled={props.disabled}
                        onChange={(newValue) => {
                            if (newValue !== undefined) {
                                props.onChange((newValue.target as HTMLInputElement).value);
                            }
                        }}
                    />
                </ArgFieldWithErrorLabel>
            );
        },
        onRenderFormulaField: (props) => {
            return (
                <ArgFieldWithErrorLabel
                    key={props.key}
                    errorMessage={props.errorMessage}
                    style={getStyleForLayoutHint(props.layoutHint)}
                >
                    <TextField
                        label={props.label}
                        value={props.value}
                        onRenderLabel={(labelProps, defaultRender) => {
                            if (!defaultRender) {
                                return null;
                            }
                            return (
                                <div className="operation-formula-field-label">
                                    <span>{defaultRender(labelProps)}</span>
                                    <TooltipHost
                                        content={
                                            <div>
                                                <span>{props.examplesLabel}</span>
                                                <ul>
                                                    {props.examples.map((example) => (
                                                        <li key={example}>
                                                            <code>{example}</code>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        }
                                    >
                                        <span className="codicon codicon-question" />
                                    </TooltipHost>
                                </div>
                            );
                        }}
                        prefix="="
                        disabled={props.disabled}
                        onChange={(_, newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(newValue);
                            }
                        }}
                    />
                </ArgFieldWithErrorLabel>
            );
        }
    }

    private handleFloatKeyDown = debounce((target: HTMLInputElement, props: IFloatFieldProps) => {
        const parsed = Number(target.value);
        if (!isNaN(parsed)) {
            props.onChange(parsed);
        }
    }, 50); // why 50? the main purpose is to have an extra timeout to wait for the target value to update - however, this is also helpful to reduce number of `setState` calls

    private handleIntKeyDown = debounce((target: HTMLInputElement, props: IIntegerFieldProps) => {
        const parsed = parseInt(target.value, 10);
        if (!isNaN(parsed) && target.value.match(/-?\d+/)) {
            props.onChange(parsed);
        }
    }, 50); // why 50? the main purpose is to have an extra timeout to wait for the target value to update - however, this is also helpful to reduce number of `setState` calls

}

function ArgFieldWithErrorLabel(props: {
    children: React.ReactNode;
    errorMessage?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div style={{ marginBottom: 5, maxWidth: "100%", ...props.style }}>
            {props.children}
            {props.errorMessage && <Label className="operationsPanel-error-label">{props.errorMessage}</Label>}
        </div>
    );
}

function getStyleForLayoutHint(hint?: IArgLayoutHint): React.CSSProperties | undefined {
    // We assume the element is in a row-oriented, wrapping flexbox.
    switch (hint) {
        case IArgLayoutHint.Fit:
            return { width: "auto", marginRight: "100%" };
        case IArgLayoutHint.Inline:
            return undefined;
        case IArgLayoutHint.InlineGrow:
            return { flexGrow: 1, flexShrink: 0, marginTop: "auto" };
        case IArgLayoutHint.Block:
        default:
            return {};
            // return { width: "100%" };
    }
}
