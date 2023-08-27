// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    IDataFrameColumnStats,
    IDataFrameHeader,
    IDataFrameRow,
    IDataFrameStats,
    IOperationView,
    ISelection
} from '@dw/messaging';
import { SharedMessages } from '../../../messageTypes';
import { WranglerDataExportFormat } from '@dw/orchestrator';

export namespace DataWranglerMessages {
    // export const Started = SharedMessages.Started;
    // export const UpdateSettings = SharedMessages.UpdateSettings;
    // export const InitializeData = 'init';
    // export const GetAllRowsRequest = 'get_all_rows_request';
    // export const GetAllRowsResponse = 'get_all_rows_response';
    // export const GetRowsRequest = 'get_rows_request';
    // export const GetRowsResponse = 'get_rows_response';
    // export const CompletedData = 'complete';
    // export const GetSliceRequest = 'get_slice_request';
    // export const RefreshDataViewer = 'refresh_data_viewer';
    // export const SliceEnablementStateChanged = 'slice_enablement_state_changed';

    /**
     * Messages sent from the host.
     */
    export enum Host {
        // SetDependencies = 'setDependencies',
        // SetKernelConnectionStatus = 'setKernelConnectionStatus',
        // SetInitialDataLoading = 'setInitialDataLoading',
        // SetInitialDataLoadingFailed = 'setInitialDataLoadingFailed',
        InitializeData = 'initData',
        LoadRows = 'loadRows',
        LoadStats = 'loadStats',
        LoadColumnStats = 'loadColumnStats',
        // SetEngineConstants = 'setEngineConstants',
        // SetVariableToWrangle = 'setVariableToWrangle',
        // SetHistory = 'setHistory',
        // SetActiveHistoryIndex = 'setActiveHistoryIndex',
        // SetVSCodeConfig = 'setVSCodeConfig',
        // SetActiveHistoryItem = 'setActiveHistoryItem',
        SetOperations = 'setOperations',
        SetGridSelection = 'setGridSelection',
        // SetOperation = 'setOperation',
        // PreviewOperation = 'previewOperation',
        // CommitOperation = 'commitOperation',
        // RejectOperation = 'rejectOperation',
        SetDataFrame = 'setDataFrame',
        // SetGridCellEdits = 'setGridCellEdits',
        // ResetUI = 'resetUI',
        // SetInputErrors = 'setInputErrors',
        // DisableCommitButton = 'disableCommitButton',
        // DisablePreviewButton = 'disablePreviewButton',
        // InstallDependenciesFailed = 'installDependenciesFailed',
        // SetViewAllTheCode = 'setPreviewAllTheCode',
        // FocusOperationSearch = 'focusOperationSearch',
        // SetCollapsedOperationGroups = 'setCollapsedOperationGroups',
        RevealColumn = 'revealColumn'
    }

    /**
     * Mapping of host messages to corresponding payloads.
     */
    export interface IHostMapping {
        //extends BaseMessaging.IHostMapping {
        // [Host.SetDependencies]: IResolvedPackageDependencyMap;
        // [Host.SetKernelConnectionStatus]: { isKernelConnected: boolean; isExternalNotebook: boolean };
        // [Host.SetInitialDataLoading]: {
        // supportsTruncation: boolean;
        // truncationRows?: number;
        // };
        // [Host.SetInitialDataLoadingFailed]: string;
        [Host.InitializeData]: ISerializedDataFrame;
        [Host.LoadRows]: {
            requestId: string;
            data: IDataFrameRow[];
        };
        [Host.LoadStats]: {
            requestId: string;
            stats: IDataFrameStats;
        };
        [Host.LoadColumnStats]: {
            requestId: string;
            columnStats: IDataFrameColumnStats;
        };
        // [Host.SetEngineConstants]: IEngineConstants;
        // [Host.SetVariableToWrangle]: string;
        // [Host.SetHistory]: IHistoryItem[];
        // [Host.SetActiveHistoryIndex]: number | undefined;
        // [Host.SetVSCodeConfig]: {
        // viewPastCodeSteps: DataWranglerViewPastCodeStepsMode;
        // enableEditLastAppliedOperation: boolean;
        // allowPreviewingAllTheCode: boolean;
        // enableDescribeYourOperation: boolean;
        // enableAutomaticCodeExecutionForDescribeOp: boolean;
        // enableParquetExport: boolean;
        // };
        // [Host.SetActiveHistoryItem]: {
        // historyItem?: IHistoryItem;
        // dataFrame?: ISerializedDataFrame;
        // };
        [Host.SetOperations]: {
            operations: IOperationView[];
            // operationContextMenu: WranglerContextMenuItem[];
        };
        [Host.SetGridSelection]: ISelection;
        // [Host.SetOperation]: {
        // operationKey?: string;
        // args?: any;
        // skipPreview?: boolean;
        // updateCodeEditor?: boolean;
        // };
        // [Host.PreviewOperation]: ISerializedDataFrame;
        // [Host.CommitOperation]: ISerializedDataFrame;
        // [Host.RejectOperation]: ISerializedDataFrame;
        [Host.SetDataFrame]: ISerializedDataFrame;
        // [Host.SetGridCellEdits]: IGridCellEdit[];
        // [Host.ResetUI]: void;
        // [Host.SetInputErrors]: { [key: string]: string };
        // [Host.DisableCommitButton]: void;
        // [Host.DisablePreviewButton]: void;
        // [Host.InstallDependenciesFailed]: void;
        // [Host.SetViewAllTheCode]: boolean;
        // [Host.FocusOperationSearch]: void;
        // [Host.SetCollapsedOperationGroups]: {
        // collapsedOperationGroups: { [key: string]: boolean };
        // };
        [Host.RevealColumn]: {
            columnIndex: number;
        };
    }

    /**
     * Messages sent from the webview.
     */
    export enum Webview {
        Started = SharedMessages.Started,
        // ChangeKernel = 'changeKernel',
        // CommitOperation = 'commitOperation',
        RejectOperation = 'rejectOperation',
        // UndoOperation = 'undoOperation',
        UpdateGridSelection = 'updateGridSelection',
        // UpdateOperation = 'updateOperation',
        // UpdateOperationUsingContextMenu = 'updateOperationUsingContextMenu',
        PreviewOperation = 'previewOperation',
        // UpdateGridCellEdits = 'updateGridCellEdits',
        ExportData = 'exportData',
        // ExportCodeToNotebook = 'exportCodeToNotebook',
        // CopyCodeToClipboard = 'copyCodeToClipboard',
        // ShowMessage = 'showMessage',
        Reload = 'reload',
        ReloadWithTruncation = 'reloadWithTruncation',
        LoadRows = 'loadRows',
        LoadStats = 'loadStats',
        LoadColumnStats = 'loadColumnStats',
        RenderCompleted = 'RenderCompleted',
        TelemetryEvent = 'telemetryEvent',
        // UpdateActiveHistoryIndex = 'updateActiveHistoryIndex',
        // InstallDependencies = 'installDependencies',
        // FocusChanged = 'focusChanged',
        // SetViewAllTheCode = 'setPreviewAllTheCode',
        // ShowErrorMessageInEditor = 'showErrorMessageInEditor',
        FocusOperationSearch = 'focusOperationSearch',
        // ReportIssue = 'ReportIssue',
        // SetCollapsedOperationGroups = 'setCollapsedOperationGroups',
        RevealColumn = 'revealColumn',
        RefreshData = 'refreshData',
        ToggleSummary = 'toggleSummary'
    }

    /**
     * Mapping of webview messages to corresponding payloads.
     */
    export interface IWebviewMapping {
        [Webview.Started]: void;
        //extends BaseMessaging.IWebviewMapping {
        // [Webview.ChangeKernel]: void;
        // [Webview.CommitOperation]: void;
        [Webview.RejectOperation]: void;
        // [Webview.UndoOperation]: void;
        [Webview.UpdateGridSelection]: ISelection;
        // [Webview.UpdateOperation]: {
        // operationKey: string;
        // args?: any;
        // };
        // [Webview.UpdateOperationUsingContextMenu]: { selection: ISelection; id: IOperationContextMenuItemIdentifier };
        [Webview.PreviewOperation]: {
            operationKey: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args: any;
            activeHistoryIndex?: number;
            skipCodeExecution?: boolean;
        };
        // [Webview.UpdateGridCellEdits]: IGridCellEdit[];
        [Webview.ExportData]: { format?: WranglerDataExportFormat };
        // [Webview.ExportCodeToNotebook]: void;
        // [Webview.CopyCodeToClipboard]: void;
        // [Webview.ShowMessage]: {
        // TODO@DW: support other message types
        // message: string;
        // };
        // [Webview.Reload]: void;
        // [Webview.ReloadWithTruncation]: {
        // rows?: number;
        // };
        [Webview.LoadRows]: {
            requestId: string;
            start: number;
            end: number;
        };
        [Webview.LoadStats]: {
            requestId: string;
        };
        [Webview.LoadColumnStats]: {
            columnIndex: number;
            requestId: string;
        };
        // [Webview.RenderCompleted]: void;
        // [Webview.TelemetryEvent]: {
        // eventName: string;
        // properties?: { [key: string]: string };
        // measurements?: { [key: string]: number };
        // };
        // [Webview.UpdateActiveHistoryIndex]: number;
        // [Webview.InstallDependencies]: void;
        // [Webview.SetViewAllTheCode]: boolean;
        // [Webview.ShowErrorMessageInEditor]: void;
        // [Webview.FocusChanged]: {
        // disableShortcuts: boolean;
        // };
        // [Webview.FocusOperationSearch]: void;
        // [Webview.ReportIssue]: void;
        // [Webview.SetCollapsedOperationGroups]: {
        // collapsedOperationGroups: { [key: string]: boolean };
        // };
        [Webview.RevealColumn]: void;
        [Webview.RefreshData]: void;
        [Webview.ToggleSummary]: void;
    }

    /**
     * Serialized format for a dataframe with loaded rows.
     */
    export interface ISerializedDataFrame extends IDataFrameHeader {
        __rows?: IDataFrameRow[];
        __stats?: IDataFrameStats;
        __columnStats?: Record<number, IDataFrameColumnStats>;
    }
}
