// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inject, injectable, named } from 'inversify';
import { EventEmitter, Memento, Uri, ViewColumn } from 'vscode';

import { capturePerfTelemetry } from '../../../telemetry';
import { DataViewerMessageListener } from './dataViewerMessageListener';
import { IDataViewer, IDataViewerDataProvider, IJupyterVariableDataProvider } from './types';
import { IKernel } from '../../../kernels/types';
import {
    IApplicationShell,
    ICommandManager,
    IWebviewPanelProvider,
    IWorkspaceService
    // IApplicationShell
} from '../../../platform/common/application/types';
import { Telemetry } from '../../../platform/common/constants';
import { traceError } from '../../../platform/logging';
import {
    IConfigurationService,
    IMemento,
    GLOBAL_MEMENTO,
    Resource,
    IDisposable,
    IExtensionContext
} from '../../../platform/common/types';
import * as localize from '../../../platform/common/utils/localize';
import { WebViewViewChangeEventArgs } from '../../../platform/webviews/types';
import { WebviewPanelHost } from '../../../platform/webviews/webviewPanelHost';
import { joinPath } from '../../../platform/vscode-path/resources';
import { IDataScienceErrorHandler } from '../../../kernels/errors/types';
import { DataWranglerMessages } from './dataWranglerMessages';
import { VSCJupyterKernelSession } from './vscodeJupyterKernelSession';
import { DataFrameTypeIdentifier } from '@dw/orchestrator';
import { WranglerEngineIdentifier } from '@dw/engines';
import { AsyncTask, ColumnType, DataImportOperationKey, IDataFrame, IOperationView } from '@dw/messaging';
import { IVariableImportOperationArgs } from '@dw/engines/lib/core/operations/dataImport/variable';
import { IDataWranglerOrchestrator } from '../variablesView/types';
import { ContextKey } from '../../../platform/common/contextKey';

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

const preloadGridData = (dataFrame: IDataFrame) =>
    preloadData(dataFrame, {
        rows: 1000,
        columnStats: true
    });

const PREFERRED_VIEWGROUP = 'JupyterDataViewerPreferredViewColumn';
@injectable()
export class DataViewer
    extends WebviewPanelHost<DataWranglerMessages.IHostMapping>
    implements IDataViewer, IDisposable
{
    private dataProvider: IDataViewerDataProvider | IJupyterVariableDataProvider | undefined;
    private pendingRowsCount: number = 0;
    private dataFrame: IDataFrame | undefined;
    private summaryVisible: ContextKey = new ContextKey('jupyter.summaryPanel', this.commandManager);

    public setDataFrame(df: IDataFrame) {
        this.dataFrame = df;
        const preloaded = preloadGridData(df);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.postMessage(DataWranglerMessages.Host.SetDataFrame, preloaded);
    }

    public get active() {
        return !!this.webPanel?.isActive();
    }

    public get refreshPending() {
        return this.pendingRowsCount > 0;
    }

    public get onDidDisposeDataViewer() {
        return this._onDidDisposeDataViewer.event;
    }

    public get onDidChangeDataViewerViewState() {
        return this._onDidChangeDataViewerViewState.event;
    }

    private _onDidDisposeDataViewer = new EventEmitter<IDataViewer>();
    private _onDidChangeDataViewerViewState = new EventEmitter<void>();

    constructor(
        @inject(IWebviewPanelProvider) provider: IWebviewPanelProvider,
        @inject(IConfigurationService) configuration: IConfigurationService,
        @inject(IWorkspaceService) workspaceService: IWorkspaceService,
        // @inject(IApplicationShell) private applicationShell: IApplicationShell,
        @inject(IMemento) @named(GLOBAL_MEMENTO) readonly globalMemento: Memento,
        @inject(IDataScienceErrorHandler) readonly errorHandler: IDataScienceErrorHandler,
        @inject(IExtensionContext) readonly context: IExtensionContext,
        @inject(IApplicationShell) private readonly applicationShell: IApplicationShell,
        @inject(IDataWranglerOrchestrator) readonly dwOrchestrator: IDataWranglerOrchestrator,
        @inject(ICommandManager) private commandManager: ICommandManager
    ) {
        const dataExplorerDir = joinPath(context.extensionUri, 'out', 'webviews', 'webview-side', 'viewers');
        super(
            configuration,
            provider,
            workspaceService,
            (c, v, d) => new DataViewerMessageListener(c, v, d),
            dataExplorerDir,
            [joinPath(dataExplorerDir, 'dataExplorer.js')],
            localize.DataScience.dataExplorerTitle,
            globalMemento.get(PREFERRED_VIEWGROUP) ?? ViewColumn.One
        );
        this.onDidDispose(this.dataViewerDisposed, this);
        this.dwOrchestrator.onSetDf(this.setDataFrame.bind(this));
        this.dwOrchestrator.onOperationsChanged((operations: IOperationView[]) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.postMessage(DataWranglerMessages.Host.SetOperations, { operations });
        });
    }

    @capturePerfTelemetry(Telemetry.DataViewerWebviewLoaded)
    public async showData(
        dataProvider: IDataViewerDataProvider | IJupyterVariableDataProvider,
        title: string
    ): Promise<void> {
        if (!this.isDisposed) {
            // Save the data provider
            this.dataProvider = dataProvider;
            const kernel = (this.dataProvider as IJupyterVariableDataProvider).kernel;
            const kernelSession = new VSCJupyterKernelSession(
                {
                    connection: kernel?.session?.kernel!,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    kernelSocket: {} as any
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                kernel?.kernelConnectionMetadata! as any
            );
            this.dwOrchestrator.setKernel(kernelSession);

            // Load the web panel using our current directory as we don't expect to load any other files
            await super.loadWebview(Uri.file(process.cwd())).catch(traceError);

            super.setTitle(title);

            const dfInfo = await this.dataProvider.getDataFrameInfo();
            this.dwOrchestrator.setTitle(dfInfo.name ?? 'df');

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            await this.dwOrchestrator.orchestrator.startWranglerSession(
                WranglerEngineIdentifier.Pandas,
                DataImportOperationKey.Variable,
                () =>
                    AsyncTask.resolve<IVariableImportOperationArgs>({
                        VariableName: dfInfo.name ?? 'df',
                        DataFrameType: dfInfo.originalVariableType?.toLowerCase().includes('pyspark')
                            ? DataFrameTypeIdentifier.PySpark
                            : DataFrameTypeIdentifier.Pandas
                    })
            );

            // Then show our web panel. Eventually we need to consume the data
            await super.show(true);

            // let dataFrameInfo = await this.prepDataFrameInfo();

            // // If higher dimensional data, preselect a slice to show
            // if (dataFrameInfo.shape && dataFrameInfo.shape.length > 2) {
            //     this.maybeSendSliceDataDimensionalityTelemetry(dataFrameInfo.shape.length);
            //     const slice = preselectedSliceExpression(dataFrameInfo.shape);
            //     dataFrameInfo = await this.getDataFrameInfo(slice);
            // }

            // // Send a message with our data
            // this.postMessage(DataViewerMessages.InitializeData, dataFrameInfo).catch(noop);
        }
    }

    public get kernel(): IKernel | undefined {
        if (this.dataProvider && 'kernel' in this.dataProvider) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return this.dataProvider.kernel;
        }
    }

    private dataViewerDisposed() {
        this._onDidDisposeDataViewer.fire(this as IDataViewer);
    }

    public async refreshData() {
        // const currentSliceExpression = this.currentSliceExpression;
        // // Clear our cached info promise
        // this.dataFrameInfoPromise = undefined;
        // // Then send a refresh data payload
        // // At this point, variable shape or type may have changed
        // // such that previous slice expression is no longer valid
        // let dataFrameInfo = await this.getDataFrameInfo(undefined, true);
        // // Check whether the previous slice expression is valid WRT the new shape
        // if (currentSliceExpression !== undefined && dataFrameInfo.shape !== undefined) {
        //     if (isValidSliceExpression(currentSliceExpression, dataFrameInfo.shape)) {
        //         dataFrameInfo = await this.getDataFrameInfo(currentSliceExpression);
        //     } else {
        //         // Previously applied slice expression isn't valid anymore
        //         // Generate a preselected slice
        //         const newSlice = preselectedSliceExpression(dataFrameInfo.shape);
        //         dataFrameInfo = await this.getDataFrameInfo(newSlice);
        //     }
        // }
        // traceInfo(`Refreshing data viewer for variable ${dataFrameInfo.name}`);
        // // Send a message with our data
        // this.postMessage(DataViewerMessages.InitializeData, dataFrameInfo).catch(noop);
        const dfInfo = await this.dataProvider!.getDataFrameInfo();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await this.dwOrchestrator.orchestrator!.startWranglerSession(
            WranglerEngineIdentifier.Pandas,
            DataImportOperationKey.Variable,
            () =>
                AsyncTask.resolve<IVariableImportOperationArgs>({
                    VariableName: dfInfo.name ?? 'df',
                    DataFrameType: dfInfo.originalVariableType?.toLowerCase().includes('pyspark')
                        ? DataFrameTypeIdentifier.PySpark
                        : DataFrameTypeIdentifier.Pandas
                })
        );
    }

    public override dispose(): void {
        super.dispose();

        if (this.dataProvider) {
            // Call dispose on the data provider
            this.dataProvider.dispose();
            this.dataProvider = undefined;
        }
    }

    protected override async onViewStateChanged(args: WebViewViewChangeEventArgs) {
        if (args.current.active && args.current.visible && args.previous.active && args.current.visible) {
            await this.globalMemento.update(PREFERRED_VIEWGROUP, this.webPanel?.viewColumn);
        }
        this._onDidChangeDataViewerViewState.fire();
    }

    protected get owningResource(): Resource {
        return undefined;
    }

    // async exportDataToFileHelper(format: WranglerDataExportFormat, fileExtension: string, formatName: string) {
    //     return await this.applicationShell.withProgress(
    //         {
    //             // TODO@DW: localize
    //             location: vscode.ProgressLocation.Notification,
    //             title: `Exporting ${formatName} file...`,
    //             cancellable: true
    //         },
    //         async (_, token) => {
    //             const exportDataTask = this.orchestrator.exportData(format);
    //             token.onCancellationRequested(() => exportDataTask.interrupt());

    //             const data = await exportDataTask;
    //             const baseUri =
    //                 this.session.metadata.type === DataWranglerSessionType.FileUri
    //                     ? this.session.metadata.originalFsPath.substring(
    //                           0,
    //                           this.session.metadata.originalFsPath.lastIndexOf('.')
    //                       )
    //                     : this.session.uri.fsPath.substring(0, this.session.uri.fsPath.lastIndexOf(DataWranglerSuffix));

    //             if (!data || token.isCancellationRequested) {
    //                 return;
    //             }

    //             let saveDialogUri = vscode.Uri.file(baseUri + '.' + fileExtension);

    //             // If we're in a walkthrough, we want to save the file in the workspace directory, or the home directory if there is no workspace
    //             if (this.session.metadata.isWalkthrough) {
    //                 const workspaceFolder = this.workspaceService.getWorkspaceFolder(this.session.uri);
    //                 const directory = workspaceFolder ? workspaceFolder.uri.fsPath : os.homedir();
    //                 saveDialogUri = vscode.Uri.file(path.join(directory, path.basename(baseUri) + '.' + fileExtension));
    //                 this.telemetryClient.debug(`Saving data as ${formatName} on`, saveDialogUri.fsPath);
    //             }

    //             // note: rather than opening an untitled file here, we must save the file directly due to limitations in the VS Code extension API
    //             // see https://github.com/microsoft/vscode/issues/32608
    //             const fileUri = await this.applicationShell.showSaveDialog({
    //                 defaultUri: saveDialogUri,
    //                 filters: {
    //                     [formatName]: [fileExtension]
    //                 }
    //             });
    //             if (fileUri) {
    //                 await this.fileSystem.writeFile(fileUri, data);
    //             }
    //             return fileUri;
    //         }
    //     );
    // }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override async onMessage(message: string, payload: any) {
        switch (message) {
            case DataWranglerMessages.Webview.RefreshData:
                await this.refreshData();
                break;
            case DataWranglerMessages.Webview.ExportData:
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.dwOrchestrator.exportDataToFile();
                break;
            case DataWranglerMessages.Webview.RevealColumn:
                const columns = this.dataFrame?.columns;
                if (!columns) {
                    return;
                }
                const columnOptions = columns.slice(1).map((col) => ({
                    label: mapColumnTypeToProductIcon(col.type) + ' ' + col.name,
                    // TODO@DW: localize
                    description: col.rawType + (col.isMixed ? ' (mixed)' : ''),
                    index: col.index
                }));
                const columnChoice = await this.applicationShell.showQuickPick(columnOptions, {
                    //TODO@DW: localize
                    placeHolder: 'Choose a column to reveal',
                    ignoreFocusOut: true
                });
                if (columnChoice) {
                    await this.postMessage(DataWranglerMessages.Host.RevealColumn, { columnIndex: columnChoice.index });
                }
                break;
            case DataWranglerMessages.Webview.LoadRows:
                if (this.dataFrame) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.dataFrame.loadRows(payload.end).then((rows) => {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.postMessage(DataWranglerMessages.Host.LoadRows, {
                            requestId: payload.requestId,
                            data: rows.slice(payload.start) // Send as many rows as we have loaded.
                        });
                    });
                }
                break;
            case DataWranglerMessages.Webview.LoadStats:
                if (this.dataFrame) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.dataFrame.loadStats().then((stats) => {
                        if (stats) {
                            // Assume that if loading was interrupted, the webview no longer needs to know.
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            this.postMessage(DataWranglerMessages.Host.LoadStats, {
                                requestId: payload.requestId,
                                stats
                            });
                        }
                    });
                }
                break;
            case DataWranglerMessages.Webview.LoadColumnStats:
                if (this.dataFrame) {
                    let columnStats = this.dataFrame.tryGetColumnStats(payload.columnIndex);
                    // let isFirstLoad = false;
                    if (!columnStats) {
                        // isFirstLoad = true;
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.dataFrame.loadColumnStats(payload.columnIndex).then((columnStats) => {
                            if (columnStats) {
                                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                                this.postMessage(DataWranglerMessages.Host.LoadColumnStats, {
                                    requestId: payload.requestId,
                                    columnStats
                                });
                            }
                        });
                    } else {
                        // Assume that if loading was interrupted, the webview no longer needs to know.
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        this.postMessage(DataWranglerMessages.Host.LoadColumnStats, {
                            requestId: payload.requestId,
                            columnStats
                        });
                    }
                }
                break;
            case DataWranglerMessages.Webview.ToggleSummary:
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.summaryVisible.set(!this.summaryVisible.value);
                break;
            case DataWranglerMessages.Webview.UpdateGridSelection:
                this.dwOrchestrator.setSelection(payload);
                break;
            case DataWranglerMessages.Webview.PreviewOperation:
                console.log('@@GOT THE PREVIEW', payload);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.dwOrchestrator.orchestrator.startPreview(
                    payload.operationKey,
                    payload.args,
                    this.dwOrchestrator.dataFrame!,
                    []
                );
                break;
            default:
                break;
        }

        super.onMessage(message, payload);
    }
}

function mapColumnTypeToProductIcon(type: ColumnType) {
    switch (type) {
        case ColumnType.Integer:
        case ColumnType.Float:
        case ColumnType.Complex:
            return '$(symbol-number)';
        case ColumnType.Boolean:
            return '$(symbol-boolean)';
        case ColumnType.Datetime:
        case ColumnType.Timedelta:
            return '$(calendar)';
        case ColumnType.String:
            return '$(symbol-text)';
        case ColumnType.Category:
        case ColumnType.Interval:
        case ColumnType.Period:
        case ColumnType.Unknown:
        default:
            return '$(database)';
    }
}
