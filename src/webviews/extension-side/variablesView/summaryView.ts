// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Uri, WebviewView as vscodeWebviewView } from 'vscode';
import { joinPath } from '../../../platform/vscode-path/resources';
import { IDataWranglerOrchestrator, IVariableViewPanelMapping } from './types';
import { VariableViewMessageListener } from './variableViewMessageListener';
import { IWorkspaceService, IWebviewViewProvider } from '../../../platform/common/application/types';
import { traceError } from '../../../platform/logging';
import {
    Resource,
    IConfigurationService,
    IDisposableRegistry,
    IDisposable,
    IExtensionContext
} from '../../../platform/common/types';
import { WebviewViewHost } from '../../../platform/webviews/webviewViewHost';
import { DataWranglerMessages } from '../dataviewer/dataWranglerMessages';
import { IDataFrame } from '@dw/messaging';

/**
 * Grabs already-loaded rows from the given dataframe and attaches them so they can be serialized.
 * Useful for eagerly sending rows to webviews to avoid flashing when the dataframe changes.
 */
export function preloadData(
    dataframe: IDataFrame,
    { rows = 0, stats = false, columnStats = false }: { rows?: number; stats?: boolean; columnStats?: boolean } = {}
): DataWranglerMessages.ISerializedDataFrame {
    if (!dataframe) {
        return dataframe;
    }

    const loaded = dataframe.getLoadedRows();
    return {
        ...dataframe,
        __rows: rows > 0 ? loaded.slice(0, rows) : undefined,
        __stats: (stats && dataframe.tryGetStats()) || undefined,
        __columnStats: (columnStats && dataframe.getLoadedColumnStats()) || undefined
    };
}

// This is the client side host for the native notebook variable view webview
// It handles passing messages to and from the react view as well as the connection
// to execution and changing of the active notebook
export class SummaryView extends WebviewViewHost<DataWranglerMessages.IHostMapping> implements IDisposable {
    protected get owningResource(): Resource {
        return undefined;
    }
    constructor(
        private dwOrchestrator: IDataWranglerOrchestrator,
        configuration: IConfigurationService,
        workspaceService: IWorkspaceService,
        provider: IWebviewViewProvider,
        context: IExtensionContext,
        private readonly disposables: IDisposableRegistry
    ) {
        const variableViewDir = joinPath(context.extensionUri, 'out', 'webviews', 'webview-side', 'viewers');
        super(
            configuration,
            workspaceService,
            (c, d) => new VariableViewMessageListener(c, d),
            provider,
            variableViewDir,
            [joinPath(variableViewDir, 'summaryView.js')]
        );
        this.dwOrchestrator.onSetDf((df) => {
            console.log('@@@SUMMARY SET');
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            df.loadStats().then(() => {
                console.log('@@@STATS', df.tryGetStats());

                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.postMessage(
                    DataWranglerMessages.Host.SetDataFrame,
                    preloadData(df, { stats: true, columnStats: true })
                );
            });
        });
        this.dwOrchestrator.onSelectionChange((selection) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.postMessage(DataWranglerMessages.Host.SetGridSelection, selection);
        });
    }

    // @capturePerfTelemetry(Telemetry.NativeVariableViewLoaded)
    public async load(codeWebview: vscodeWebviewView) {
        await super.loadWebview(Uri.file(process.cwd()), codeWebview).catch(traceError);

        // After loading, hook up our visibility watch and check the initial visibility
        if (this.webviewView) {
            this.disposables.push(
                this.webviewView.onDidChangeVisibility(() => {
                    this.handleVisibilityChanged();
                })
            );
        }
        this.handleVisibilityChanged();
    }

    // Used to identify this webview in telemetry, not shown to user so no localization
    // for webview views
    public get title(): string {
        return 'summaryView';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override onMessage(message: string, payload: any) {
        console.log('@@@SUMMARY GOT', message);

        switch (message) {
            case DataWranglerMessages.Webview.Started:
                if (this.dwOrchestrator.dataFrame) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.postMessage(DataWranglerMessages.Host.SetDataFrame, this.dwOrchestrator.dataFrame!);
                }
                break;
            // case InteractiveWindowMessages.ShowDataViewer:
            //     this.handleMessage(message, payload, this.showDataViewer);
            //     break;
            case DataWranglerMessages.Webview.LoadRows:
                if (this.dwOrchestrator.dataFrame) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.dwOrchestrator.dataFrame.loadRows(payload.end).then((rows) => {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.postMessage(DataWranglerMessages.Host.LoadRows, {
                            requestId: payload.requestId,
                            data: rows.slice(payload.start) // Send as many rows as we have loaded.
                        });
                    });
                }
                break;
            case DataWranglerMessages.Webview.LoadStats:
                if (this.dwOrchestrator.dataFrame) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.dwOrchestrator.dataFrame.loadStats().then((stats) => {
                        if (stats) {
                            // Assume that if loading was interrupted, the webview no longer needs to know.
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            this.postMessage(DataWranglerMessages.Host.LoadStats, {
                                requestId: payload.requestId,
                                stats: payload.stats
                            });
                        }
                    });
                }
                break;
            case DataWranglerMessages.Webview.LoadColumnStats:
                if (this.dwOrchestrator.dataFrame) {
                    let columnStats = this.dwOrchestrator.dataFrame.tryGetColumnStats(payload.columnIndex);
                    // let isFirstLoad = false;
                    if (!columnStats) {
                        // isFirstLoad = true;
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.dwOrchestrator.dataFrame.loadColumnStats(payload.columnIndex).then((columnStats) => {
                            if (columnStats) {
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                this.postMessage(DataWranglerMessages.Host.LoadColumnStats, {
                                    requestId: payload.requestId,
                                    columnStats
                                });
                            }
                        });
                    }
                }
                break;
            default:
                break;
        }

        super.onMessage(message, payload);
    }

    // Handle message helper function to specifically handle our message mapping type
    protected handleMessage<M extends IVariableViewPanelMapping, T extends keyof M>(
        _message: T,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: any,
        handler: (args: M[T]) => void
    ) {
        const args = payload as M[T];
        handler.bind(this)(args);
    }

    // Variable view visibility has changed. Update our context key for command enable / disable
    private handleVisibilityChanged() {
        // const context = new ContextKey('jupyter.variableViewVisible', this.commandManager);
        let visible = false;
        if (this.webviewView) {
            visible = this.webviewView.visible;
        }
        // context.set(visible).catch(noop);
        // // I've we've been made visible, make sure that we are updated
        if (visible) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.postMessage(DataWranglerMessages.Host.SetDataFrame, this.dwOrchestrator.dataFrame!);
        }
        //     sendTelemetryEvent(Telemetry.NativeVariableViewMadeVisible);
        //     // If there is an active execution count, update the view with that info
        //     // Keep the variables up to date if document has run cells while the view was not visible
        //     if (this.notebookWatcher.activeNotebookExecutionCount !== undefined) {
        //         this.postMessage(InteractiveWindowMessages.UpdateVariableViewExecutionCount, {
        //             executionCount: this.notebookWatcher.activeNotebookExecutionCount
        //         }).catch(noop);
        //     } else {
        //         // No active view, so just trigger refresh to clear
        //         this.postMessage(InteractiveWindowMessages.ForceVariableRefresh).catch(noop);
        //     }
        // }
    }
}
