// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Event } from 'vscode';
import { IVariableExplorerHeight } from '../../../webviews/webview-side/interactive-common/redux/reducers/types';
import { InteractiveWindowMessages, IShowDataViewer, IFinishCell, SharedMessages } from '../../../messageTypes';
import { IKernel } from '../../../kernels/types';
import { IJupyterVariablesRequest, IJupyterVariablesResponse } from '../../../kernels/variables/types';
import { IVSCWebviewViewProvider } from '../../../platform/webviews/types';
import { BasicOrchestrator, WranglerDataExportFormat } from '@dw/orchestrator';
import { IDataFrame, IOperationView, ISelection } from '@dw/messaging';
import { IKernelSession } from '../dataviewer/dataWranglerTypes';

// Mapping of Message to payload that our VariableViewPanel needs to support
export class IVariableViewPanelMapping {
    public [InteractiveWindowMessages.ForceVariableRefresh]: never | undefined;
    public [InteractiveWindowMessages.SettingsUpdated]: string;
    public [InteractiveWindowMessages.Activate]: never | undefined;
    public [InteractiveWindowMessages.ShowDataViewer]: IShowDataViewer;
    public [InteractiveWindowMessages.GetVariablesRequest]: IJupyterVariablesRequest;
    public [InteractiveWindowMessages.GetVariablesResponse]: IJupyterVariablesResponse;
    public [InteractiveWindowMessages.VariableExplorerToggle]: boolean;
    public [InteractiveWindowMessages.SetVariableExplorerHeight]: IVariableExplorerHeight;
    public [InteractiveWindowMessages.VariableExplorerHeightResponse]: IVariableExplorerHeight;
    public [InteractiveWindowMessages.OpenLink]: string | undefined;
    public [InteractiveWindowMessages.VariablesComplete]: never | undefined;
    public [SharedMessages.UpdateSettings]: string;
    public [SharedMessages.LocInit]: string;
    public [InteractiveWindowMessages.FinishCell]: IFinishCell;
    public [InteractiveWindowMessages.UpdateVariableViewExecutionCount]: { executionCount: number };
    public [InteractiveWindowMessages.GetHTMLByIdRequest]: string;
    public [InteractiveWindowMessages.GetHTMLByIdResponse]: string;
    public [InteractiveWindowMessages.RestartKernel]: never | undefined;
}

export interface IActiveNotebookChangedEvent {
    executionCount?: number;
}

export const INotebookWatcher = Symbol('INotebookWatcher');
export interface INotebookWatcher {
    readonly activeKernel?: IKernel;
    readonly activeNotebookExecutionCount?: number;
    readonly onDidChangeActiveNotebook: Event<IActiveNotebookChangedEvent>;
    readonly onDidFinishExecutingActiveNotebook: Event<{ executionCount: number }>;
    readonly onDidRestartActiveNotebook: Event<void>;
}

export const IVariableViewProvider = Symbol('IVariableViewProvider');
export interface IVariableViewProvider extends IVSCWebviewViewProvider {}

export const ISummaryViewProvider = Symbol('ISummaryViewProvider');
export interface ISummaryViewProvider extends IVSCWebviewViewProvider {}

export const IDataWranglerOrchestrator = Symbol('IDataWranglerOrchestrator');
export interface IDataWranglerOrchestrator {
    orchestrator: BasicOrchestrator;
    dataFrame: IDataFrame | undefined;
    setTitle: (title: string) => void;
    setKernel: (kernel: IKernelSession) => void;
    setSelection: (selection: ISelection) => void;
    onSetDf: (listener: (df: IDataFrame) => void) => void;
    onSelectionChange: (listener: (selection: ISelection) => void) => void;
    exportDataToFile: (format?: WranglerDataExportFormat) => Promise<void>;
    onOperationsChanged: (listener: (operations: IOperationView[]) => void) => void;
}
