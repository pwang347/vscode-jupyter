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
import { CommandBar, IconButton, Label, PartialTheme, Position, SelectableOptionMenuItemType, SpinButton, TextField, ThemeProvider, VirtualizedComboBox, initializeIcons } from '@fluentui/react';
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
import { DateTimePicker } from './dateTimePicker';
import { StringField } from './stringField';
import { UpdateButton } from './updateButton';

initializeIcons(); // Register all FluentUI icons being used to prevent developer console errors
registerIcons({
    icons: {
        FilterAscending: <FilterAscendingIcon />,
        FilterDescending: <FilterDescendingIcon />,
        DataWrangler: <svg className='data-wrangler-icon' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 3H3.75001L3.01501 3.585L2.01001 8.085L2.74501 9H8.07001L7.26001 12.585L7.99501 13.5H11.775L13.215 13.215L13.455 12H8.94001L9.60001 9H14.31L13.935 10.68C14.04 10.515 14.175 10.38 14.325 10.26C14.715 9.945 15.195 9.765 15.69 9.75L15.855 9H20.565L19.905 12H18.045L18.285 13.215L19.95 13.545C20.325 13.62 20.685 13.8 20.985 14.055L23.235 3.915L22.5 3ZM8.40001 7.5H3.69001L4.35001 4.5H9.06001L8.40001 7.5ZM14.655 7.5H9.93001L10.605 4.5H15.315L14.655 7.5ZM20.895 7.5H16.185L16.845 4.5H21.57L20.895 7.5Z" fill="#424242"/>
        <path d="M5.18989 15L4.58989 17.67L4.52989 18H0.749893L0.0148926 17.085L0.479893 15H5.18989Z" fill="#424242"/>
        <path d="M10.8451 17.67L10.7701 18H6.06006L6.72006 15H9.88506C9.79506 15.24 9.75006 15.48 9.75006 15.75C9.75006 16.275 9.93006 16.77 10.2601 17.175C10.4251 17.37 10.6201 17.55 10.8451 17.67Z" fill="#424242"/>
        <path d="M6.19506 10.5L5.52006 13.5H0.810059L1.47006 10.5H6.19506Z" fill="#424242"/>
        <path d="M20.25 15.75C20.25 15.923 20.19 16.09 20.081 16.224C19.972 16.358 19.819 16.45 19.65 16.485L17.681 16.879C17.484 16.918 17.303 17.015 17.161 17.157C17.019 17.299 16.922 17.48 16.883 17.677L16.486 19.649C16.452 19.819 16.36 19.971 16.226 20.08C16.092 20.189 15.924 20.249 15.751 20.249C15.578 20.249 15.41 20.189 15.276 20.08C15.142 19.971 15.05 19.818 15.016 19.649L14.622 17.677C14.583 17.48 14.486 17.299 14.344 17.157C14.202 17.015 14.021 16.918 13.824 16.879L11.852 16.485C11.682 16.451 11.53 16.359 11.421 16.225C11.312 16.091 11.252 15.923 11.252 15.75C11.252 15.577 11.312 15.409 11.421 15.275C11.53 15.141 11.683 15.049 11.852 15.015L13.821 14.621C14.018 14.582 14.199 14.485 14.341 14.343C14.483 14.201 14.58 14.02 14.619 13.823L15.016 11.851C15.05 11.681 15.142 11.529 15.276 11.42C15.41 11.311 15.578 11.251 15.751 11.251C15.924 11.251 16.092 11.311 16.226 11.42C16.36 11.529 16.452 11.682 16.486 11.851L16.88 13.82C16.919 14.017 17.016 14.198 17.158 14.34C17.3 14.482 17.481 14.579 17.678 14.618L19.65 15.015C19.819 15.05 19.972 15.142 20.081 15.276C20.19 15.41 20.25 15.577 20.25 15.75Z" fill="#424242"/>
        <path d="M24 21C24 21.173 23.94 21.34 23.831 21.474C23.722 21.608 23.569 21.7 23.4 21.735L22.218 21.97C22.158 21.983 22.102 22.013 22.059 22.057C22.016 22.101 21.986 22.157 21.974 22.217L21.736 23.399C21.702 23.569 21.61 23.721 21.476 23.83C21.342 23.939 21.174 23.999 21.001 23.999C20.828 23.999 20.66 23.939 20.526 23.83C20.392 23.721 20.3 23.568 20.266 23.399L20.031 22.214C20.018 22.154 19.988 22.098 19.944 22.055C19.9 22.012 19.844 21.982 19.784 21.97L18.602 21.735C18.432 21.701 18.28 21.609 18.171 21.475C18.062 21.341 18.002 21.173 18.002 21C18.002 20.827 18.062 20.659 18.171 20.525C18.28 20.391 18.433 20.299 18.602 20.265L19.784 20.03C19.844 20.017 19.9 19.987 19.943 19.943C19.986 19.899 20.016 19.843 20.028 19.783L20.266 18.601C20.3 18.432 20.392 18.279 20.526 18.17C20.66 18.061 20.828 18.001 21.001 18.001C21.174 18.001 21.342 18.061 21.476 18.17C21.61 18.279 21.702 18.432 21.736 18.601L21.971 19.783C21.984 19.843 22.014 19.899 22.058 19.942C22.102 19.985 22.158 20.015 22.218 20.027L23.4 20.265C23.569 20.3 23.722 20.392 23.831 20.525C23.94 20.659 24 20.826 24 20.999V21Z" fill="#424242"/>
        </svg>
    }
})
const spinButtonInputProps = { size: 1 };

const toolbarHeight = "31px";

const loadingShimmer = [{ type: ShimmerElementType.line, height: 10 }];
const loadingShimmerColors = {
    shimmer: "var(--theme-wrangler-grid-header-cell-default-hover-bg)",
    shimmerWave: "var(--theme-wrangler-grid-cell-default-column-selected-hover-bg)"
};

/**
 * Returns the current VS Code theme.
 * See https://stackoverflow.com/questions/37257911/detect-light-dark-theme-programatically-in-visual-studio-code
 */
export function detectBaseTheme(): VSCodeTheme {
    const body = document.body;
    const className = body?.className.split(" ").find((c) => c.startsWith("vscode"));
    if (className === "vscode-high-contrast") {
        const themeName = body.getAttribute("data-vscode-theme-name");
        if (themeName === "Dark High Contrast") {
            return VSCodeTheme.HCDark;
        } else if (themeName === "Light High Contrast") {
            return VSCodeTheme.HCLight;
        }
    }
    return (className as VSCodeTheme) ?? VSCodeTheme.Light;
}

/**
 * VS Code themes.
 */
export enum VSCodeTheme {
    Light = "vscode-light",
    Dark = "vscode-dark",
    HCDark = "vscode-high-contrast-dark",
    HCLight = "vscode-high-contrast-light"
}


/**
 * Light theme for fluent
 * See: https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
 */
export const fluentThemeLight: PartialTheme = {
    palette: {
        themeDarker: "#004578",
        themeDark: "#005a9e",
        themeDarkAlt: "#106ebe",
        themePrimary: "#0078d4",
        themeSecondary: "#2b88d8",
        themeTertiary: "#71afe5",
        themeLight: "#c7e0f4",
        themeLighter: "#deecf9",
        themeLighterAlt: "#eff6fc",
        black: "#000000",
        neutralDark: "#201f1e",
        neutralPrimary: "#323130",
        neutralPrimaryAlt: "#3b3a39",
        neutralSecondary: "#605e5c",
        neutralTertiary: "#a19f9d",
        white: "#ffffff",
        neutralTertiaryAlt: "#c8c6c4",
        neutralQuaternaryAlt: "#e1dfdd",
        neutralLight: "#edebe9",
        neutralLighter: "#f3f2f1",
        neutralLighterAlt: "#faf9f8"
    }
};

/**
 * Dark theme for fluent
 * See: https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
 */
export const fluentThemeDark: PartialTheme = {
    palette: {
        themeDarker: "#84c5f9",
        themeDark: "#59b0f7",
        themeDarkAlt: "#3ca2f6",
        themePrimary: "#2899f5",
        themeSecondary: "#2286d7",
        themeTertiary: "#185b93",
        themeLight: "#0c2e49",
        themeLighter: "#061827",
        themeLighterAlt: "#02060a",
        black: "#fafafa",
        neutralDark: "#f5f5f5",
        neutralPrimary: "#d4d4d4",
        neutralPrimaryAlt: "#ebebeb",
        neutralSecondary: "#e7e7e7",
        neutralTertiary: "#e2e2e2",
        white: "#1e1e1e",
        neutralTertiaryAlt: "#6d6d6d",
        neutralQuaternaryAlt: "#484848",
        neutralLight: "#3f3f3f",
        neutralLighter: "#313131",
        neutralLighterAlt: "#282828"
    }
};

/**
 * High contrast dark theme for fluent
 * See: https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
 */
export const fluentThemeHCDark: PartialTheme = {
    palette: {
        themeDarker: "#6fc3df",
        themeDark: "#6fc3df",
        themeDarkAlt: "#6fc3df",
        themePrimary: "#6fc3df",
        themeSecondary: "#6fc3df",
        themeTertiary: "#6fc3df",
        themeLight: "#6fc3df",
        themeLighter: "#6fc3df",
        themeLighterAlt: "#6fc3df",
        black: "#ffffff",
        neutralDark: "#ffffff",
        neutralPrimary: "#ffffff",
        neutralPrimaryAlt: "#ffffff",
        neutralSecondary: "#ffffff",
        neutralTertiary: "#ffffff",
        white: "#000000",
        neutralTertiaryAlt: "#000000",
        neutralQuaternaryAlt: "#000000",
        neutralLight: "#000000",
        neutralLighter: "#000000",
        neutralLighterAlt: "#000000"
    }
};

/**
 * High contrast light theme for fluent
 * See: https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
 */
export const fluentThemeHCLight: PartialTheme = {
    palette: {
        themeDarker: "#0f4a85",
        themeDark: "#0f4a85",
        themeDarkAlt: "#0f4a85",
        themePrimary: "#0f4a85",
        themeSecondary: "#0f4a85",
        themeTertiary: "#0f4a85",
        themeLight: "#0f4a85",
        themeLighter: "#0f4a85",
        themeLighterAlt: "#0f4a85",
        black: "#000000",
        neutralDark: "#000000",
        neutralPrimary: "#000000",
        neutralPrimaryAlt: "#000000",
        neutralSecondary: "#000000",
        neutralTertiary: "#000000",
        white: "#ffffff",
        neutralTertiaryAlt: "#ffffff",
        neutralQuaternaryAlt: "#ffffff",
        neutralLight: "#ffffff",
        neutralLighter: "#ffffff",
        neutralLighterAlt: "#ffffff"
    }
};



/**
 * Given the current VS Code theme, retrieves the corresponding fluent UI theme object.
 */
export function getFluentTheme(theme: VSCodeTheme): PartialTheme {
    if (theme === VSCodeTheme.Dark) {
        return fluentThemeDark;
    } else if (theme === VSCodeTheme.HCDark) {
        return fluentThemeHCDark;
    } else if (theme === VSCodeTheme.HCLight) {
        return fluentThemeHCLight;
    }
    return fluentThemeLight;
}

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
    filterErrors: string | undefined;
    filterErrorsTop: string | undefined;
    sortArgs: ISortOperationArgs | undefined;
    sortErrors: string | undefined;
    sortErrorsTop: string | undefined;
    operations: IOperationView[];
    theme: VSCodeTheme;
}

/**
 * A panel containing the data wrangler grid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GridPanel extends React.PureComponent<any, IGridPanelState> implements IMessageHandler {
    private gridRef = React.createRef<ReactDataGrid>();
    private updateButtonRef = React.createRef<UpdateButton>();

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
        filterErrors: undefined,
        filterErrorsTop: undefined,
        sortArgs: undefined,
        sortErrors: undefined,
        sortErrorsTop: undefined,
        operations: [],
        theme: detectBaseTheme()
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
                <CommandBar styles={{
                    root: {
                        flexGrow: 1,
                    height: toolbarHeight,
                    padding: 0,
                    }
                }} items={[{
                    key: "findColumn",
                    style: {
                        marginLeft: 14
                    },
                    onRenderIcon: () => <span className="codicon codicon-search" />,
                    text: "Find column",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Find column")
                    },
                    onClick: () => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RevealColumn);
                    },
                    disabled: noDataFrame
                //     onRender: () => <VSCodeButton
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RevealColumn);
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Find column")}
                // >
                //     {/* TODO@DW:localize */}
                //     Find column
                //     <span slot="start" className="codicon codicon-search" />
                // </VSCodeButton>
                }, {
                    key: "filter",
                    id: "filter-button",
                    onRenderIcon: () => <span className="codicon codicon-filter" />,
                    text: (this.state.filterErrors || this.state.filterErrorsTop) ? "Filter (⚠️)" : this.countFilterTargets() > 0 ? `Filter (${this.countFilterTargets()})` : "Filter",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Filter")
                    },
                    onClick: () => {
                        if (this.state.filterVisible) {
                            return;
                        }
                        this.setState({
                            filterVisible: true,
                            sortVisible: false
                        })
                    },
                    disabled: noDataFrame
                //     onRender: () =>                 <VSCodeButton
                //     id="filter-button"
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         if (this.state.filterVisible) {
                //             return;
                //         }
                //         this.setState({
                //             filterVisible: true,
                //             sortVisible: false
                //         })
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Filter")}
                // >
                //     {/* TODO@DW:localize */}
                //     {this.countFilterTargets() > 0 ? `Filter (${this.countFilterTargets()})` : "Filter"}
                //     <span slot="start" className="codicon codicon-filter" />
                // </VSCodeButton>
                }, {
                    key: "sort",
                    id: "sort-button",
                    onRenderIcon: () => <span className="codicon codicon-sort-precedence" />,
                    text: (this.state.sortErrors || this.state.sortErrorsTop) ? "Sort (⚠️)" : this.countSortTargets() > 0 ? `Sort (${this.countSortTargets()})` : "Sort",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Sort")
                    },
                    onClick: () => {
                        if (this.state.sortVisible) {
                            return;
                        }
                        this.setState({
                            sortVisible: true,
                            filterVisible: false
                        })
                    },
                    disabled: noDataFrame
                //     onRender: () =><VSCodeButton
                //     id="sort-button"
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         if (this.state.sortVisible) {
                //             return;
                //         }
                //         this.setState({
                //             sortVisible: true,
                //             filterVisible: false
                //         })
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Sort")}
                // >
                //     {/* TODO@DW:localize */}
                //     {this.countSortTargets() > 0 ? `Sort (${this.countSortTargets()})` : "Sort"}
                //     <span slot="start" className="codicon codicon-sort-precedence" />
                // </VSCodeButton>
                }, {
                    key: "summary",
                    onRenderIcon: () => <span className="codicon codicon-list-flat" />,
                    text: "Summary",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Summary")
                    },
                    onClick: () => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ToggleSummary);
                    },
                    disabled: noDataFrame
                //     onRender: () => <VSCodeButton
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ToggleSummary);
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Summary")}
                // >
                //     {/* TODO@DW:localize */}
                //     Summary
                //     <span slot="start" className="codicon codicon-list-flat" />
                // </VSCodeButton>
                }, {
                    key: "export",
                    onRenderIcon: () => <span className="codicon codicon-table" />,
                    text: "Export data",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Export data")
                    },
                    onClick: async () => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ExportData, {
                            exportPreview: this.state.dataFrame?.isPreview && !this.state.dataFrame.isPreviewUnchanged
                        });
                    },
                    disabled: noDataFrame
                //     onRender: () => <VSCodeButton
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={async () => {
                //         this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ExportData, {
                //             exportPreview: this.state.dataFrame?.isPreview && !this.state.dataFrame.isPreviewUnchanged
                //         });
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Export data")}
                // >
                //     {/* TODO@DW:localize */}
                //     Export data
                //     <span slot="start" className="codicon codicon-table"></span>
                // </VSCodeButton> 
                }, {
                    key: "refresh",
                    onRenderIcon: () => <span className="codicon codicon-refresh" />,
                    text: "Refresh data",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Refresh data")
                    },
                    onClick: () => {
                                this.setState({
                                    sortArgs: undefined,
                                    filterArgs: undefined,
                                    filterErrors: undefined,
                                    filterErrorsTop: undefined,
                                    sortErrors: undefined,
                                    sortErrorsTop: undefined,
                                    sortVisible: false,
                                    filterVisible: false
                                })
                                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RefreshData);
                            },
                    disabled: noDataFrame
                //     onRender: () => <VSCodeButton
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         this.setState({
                //             sortArgs: undefined,
                //             filterArgs: undefined,
                //             sortVisible: false,
                //             filterVisible: false
                //         })
                //         this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.RefreshData);
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Refresh data")}
                // >
                //     {/* TODO@DW:localize */}
                //     Refresh data
                //     <span slot="start" className="codicon codicon-refresh" />
                // </VSCodeButton>
                }]} farItems={[{
                    key: "dataWrangler",
                    onRenderIcon: () => <Icon className="data-wrangler-icon" iconName='DataWrangler'/>,
                    text: "Edit in Data Wrangler",
                    tooltipHostProps: {
                        content: askToPerformOperationDataFrame(/* TODO@DW:localize */ "Edit in Data Wrangler")
                    },
                    onClick: () => {
                        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.EditInDataWrangler);
                    },
                    disabled: noDataFrame
                //     onRender: () => <VSCodeButton
                //     appearance="secondary"
                //     className="gridPanel-toolbar-vscode-button"
                //     onClick={() => {
                //         this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.EditInDataWrangler);
                //     }}
                //     disabled={noDataFrame}
                //     title={askToPerformOperationDataFrame(/* TODO@DW:localize */ "Edit in Data Wrangler")}
                // >
                //     {/* TODO@DW:localize */}
                //     Edit in Data Wrangler
                //     <span slot="start"><Icon className="data-wrangler-icon" iconName='DataWrangler'/></span>
                // </VSCodeButton> 
                }]} />
        );
    }

    renderSort() {
        if (!this.state.sortVisible) {
            return null;
        }

        return <Callout id="sort-callout" target={'#sort-button'} role="dialog"
        preventDismissOnEvent={(e) => {
            const callout = document.querySelector("#sort-callout");
            if (callout?.contains(e.target as HTMLElement)) {
                return true;
            }
            return e.type !== "click" || (e.target as HTMLDivElement).id === "dismiss-button"
        }}
        isBeakVisible={false}
        gapSpace={0} onDismiss={() => {
            this.setState({
                sortVisible: false
            })
        }}><div style={{padding: 20, maxWidth: 500}}><div style={{position: "absolute", right: 0, top: 0}}><VSCodeButton
        id="dismiss-button"
        appearance="secondary"
        className="gridPanel-toolbar-vscode-button"
        onClick={() => {
            this.setState({
                sortErrors: undefined,
                sortErrorsTop: undefined,
                sortArgs: getDefaultArgs(
                    this.state.dataFrame!,
                    this.state.operations.find((operation) => operation.key === OperationKey.Sort)?.args ?? [],
                    []
                ) as any,
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
            activeHistoryDataFrameHeader: this.state.originalDataFrame,
            inputErrors: {...this.state.sortErrors ? {
                AdditionalSortColumns: this.state.sortErrors
            } : undefined, ...this.state.sortErrorsTop ? {
                AdditionalSortColumns: this.state.sortErrorsTop
            } : undefined}
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
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
                this.updateErrorState();

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

        return <Callout id="filter-callout" target={'#filter-button'} role="dialog"
        preventDismissOnEvent={(e) => {
            const callout = document.querySelector("#filter-callout");
            if (callout?.contains(e.target as HTMLElement)) {
                return true;
            }
            return e.type !== "click" || (e.target as HTMLDivElement).id === "dismiss-button"
        }}
        isBeakVisible={false}
        gapSpace={0} onDismiss={() => {
            this.setState({
                filterVisible: false
            })
        }}><div style={{padding: 20, maxWidth: 500}}><div style={{position: "absolute", right: 0, top: 0}}><VSCodeButton
        id="dismiss-button"
        appearance="secondary"
        className="gridPanel-toolbar-vscode-button"
        onClick={() => {
            this.setState({
                filterErrors: undefined,
                filterErrorsTop: undefined,
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
            activeHistoryDataFrameHeader: this.state.originalDataFrame,
            inputErrors: {...this.state.filterErrors ? {
                AdditionalConditions: this.state.filterErrors
            } : undefined, ...this.state.filterErrorsTop ? {
                AdditionalConditions: this.state.filterErrorsTop
            } : undefined}
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
                this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.PreviewOperation, {
                    operationKey: OperationKey.FilterAndSort,
                    args: {
                        filter: this.state.filterArgs,
                        sort: this.state.sortArgs
                    }
                });
                this.updateErrorState();
            })
        }, () => {
        }, LocalizedStrings.Operations, this.renderers)}</div>
        </Callout>
    }

    private updateErrorState() {
        if (this.state.filterErrors || this.state.filterErrorsTop) {
            this.setState({
                filterErrors: undefined,
                filterErrorsTop: undefined
            })
        }

        if (this.state.sortErrors || this.state.sortErrorsTop) {
            this.setState({
                sortErrors: undefined,
                sortErrorsTop: undefined
            })
        }

        if (this.state.filterArgs?.AdditionalConditions.children.some((child) => !child.TargetColumns.subMenu.TypedCondition.Condition?.value)) {
            this.setState({
                filterErrors: "⚠️ No filter applied because some conditions are missing"
            })
        }
        if (this.state.filterArgs?.AdditionalConditions.children.some((child) => child.TargetColumns.value.length === 0)) {
            this.setState({
                filterErrors: "⚠️ No filter applied because some targets are missing"
            })
        }
        if ((this.state.filterArgs?.TargetColumns.value.length ?? 0) > 0 && (!this.state.filterArgs?.TargetColumns.subMenu.TypedCondition.Condition?.value)) {
            this.setState({
                filterErrorsTop: "⚠️ No filter applied because some conditions are missing"
            })
        }
        if ((this.state.filterArgs?.AdditionalConditions.children.length ?? 0) > 0 && (this.state.filterArgs?.TargetColumns.value.length ?? 0) === 0) {
            this.setState({
                filterErrorsTop: "⚠️ No filter applied because some targets are missing"
            })
        }
        if (this.state.sortArgs?.AdditionalSortColumns.children.some((child) => child.TargetColumns.value.length === 0)) {
            this.setState({
                sortErrors: "⚠️ No sort applied because some targets are missing"
            })
        }
        if ((this.state.sortArgs?.AdditionalSortColumns.children.length ?? 0) > 0 && (this.state.sortArgs?.TargetColumns.value.length ?? 0) === 0) {
            this.setState({
                sortErrorsTop: "⚠️ No sort applied because some targets are missing"
            })
        }
    }
    
    override render() {
        const fluentTheme = getFluentTheme(this.state.theme);
        return <ThemeProvider theme={fluentTheme} style={{ background: "transparent", height: "100%" }}>
         <div
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
                let sort = !!this.state.sortArgs?.TargetColumns.value.find((target) => target.key === props.key);
                let sortAsc = false;
                let sortOrder = -1;
                if (sort) {
                    sortAsc = this.state.sortArgs?.SortOrder.value === "ascending";
                    sortOrder = 1;
                }
                const index = this.state.sortArgs?.AdditionalSortColumns.children.findIndex((sort) => sort.TargetColumns.value.find((target) => target.key === props.key));
                if (index !== -1) {
                    sort = true;
                    sortAsc = this.state.sortArgs?.AdditionalSortColumns.children[index!].SortOrder.value === "ascending"
                }
                const uniqueSorts = Array.from(new Set(this.state.sortArgs?.AdditionalSortColumns.children.map((child) => child.TargetColumns.value[0]?.key)));
                if (sortOrder === -1 && sort) {
                    sortOrder = uniqueSorts.indexOf(props.key) + 2;
                }
                const filter = this.state.filterArgs?.TargetColumns.value.find((target) => target.key === props.key) ?? this.state.filterArgs?.AdditionalConditions.children.some((cond) => cond.TargetColumns.value.find((target) => target.key === props.key));
                if (sort && sortAsc === true) {
                    if (filter) {
                        iconName = "FilterAscending";
                    } else {
                        iconName = "SortUp";
                    }
                } else if (sort && sortAsc === false) {
                    if (filter) {
                        iconName = "FilterDescending";
                    } else {
                        iconName = "SortDown";
                    }
                } else {
                    if (filter) {
                        iconName = "Filter";
                    } else {
                    // className += " wrangler-column-header-overflow-menu";
                    return <div></div>
                    }
                }
                let tooltip = undefined;
                const priority = this.countSortTargets() > 1 ? ` (priority ${sortOrder})` : "";
                if (filter && sort) {
                    if (sortAsc) {
                        tooltip = `This column is filtered and sorted in ascending order${priority}.`
                    } else {
                        tooltip = `This column is filtered and sorted in descending order${priority}.`
                    }
                } else if (filter) {
                    tooltip = "This column is filtered."
                } else if (sort) {
                    if (sortAsc) {
                        tooltip = `This column is sorted in ascending order${priority}.`
                    } else {
                        tooltip = `This column is sorted in descending order${priority}.`
                    }
                }
                return (
                    <TooltipHost content={tooltip}>
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
                    </TooltipHost>
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
    </ThemeProvider>
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
                <ArgFieldWithErrorLabel key={props.key} errorMessage={props.errorMessage} style={{width: "100%"}}>
                    <div style={{ minHeight: 10, width: "fit-content" }}>
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
                                    itemType: SelectableOptionMenuItemType.SelectAll,
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
                                            borderColor: getFluentTheme(this.state.theme).palette?.themePrimary
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
                                            borderColor: getFluentTheme(this.state.theme).palette?.themePrimary
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
                                        borderColor: getFluentTheme(this.state.theme).palette?.themePrimary
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
                    <DateTimePicker
                        {...props}
                        // TODO@DW: localize
                        locStrings={{
                            dateTimePickerInvalidDateTimeFormatMessage:
                                "{0} is not a valid date time value."
                        }}
                    />
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
                        inputProps={spinButtonInputProps}
                        disabled={props.disabled}
                        // see https://github.com/microsoft/fluentui/issues/5326
                        onKeyDown={(e) => {
                            let target = e.target as HTMLInputElement;
                            this.handleFloatKeyDown(target, props);
                        }}
                        onChange={(_, newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(parseFloat(newValue));
                            }
                        }}
                        styles={(props) => {
                            if (!props.isFocused) {
                                return {
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
                                };
                            }
                            return {};
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
                        inputProps={spinButtonInputProps}
                        disabled={props.disabled}
                        // see https://github.com/microsoft/fluentui/issues/5326
                        onKeyDown={(e) => {
                            let target = e.target as HTMLInputElement;
                            this.handleIntKeyDown(target, props);
                        }}
                        onChange={(_, newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(parseInt(newValue, 10));
                            }
                        }}
                        styles={(props) => {
                            if (!props.isFocused) {
                                return {
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
                                };
                            }
                            return {};
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
                    <StringField {...props} updateButtonRef={this.updateButtonRef} />
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
                        inputProps={spinButtonInputProps}
                        disabled={props.disabled}
                        onChange={(_, newValue) => {
                            if (newValue !== undefined) {
                                props.onChange(newValue);
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
            return { /*flexGrow: 1,*/ flexShrink: 0, marginTop: "auto" };
        case IArgLayoutHint.Block:
        default:
            return {};
            // return { width: "100%" };
    }
}
