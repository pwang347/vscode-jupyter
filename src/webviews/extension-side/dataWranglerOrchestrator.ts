// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { BasicOrchestrator, LocalizedStrings, WranglerDataExportFormat } from '@dw/orchestrator';
import { inject, injectable } from 'inversify';
import {
    ICodeExecutorOptions,
    IDataFrame,
    IEngineConstants,
    IError,
    IGridCellEdit,
    IHistoryItem,
    IOperationView,
    IOrchestratorComms,
    IResolvedPackageDependencyMap,
    ISelection,
    WranglerContextMenuItem,
    formatString
} from '@dw/messaging';
import { IKernelSession } from './dataviewer/dataWranglerTypes';
import { PandasEngine, WranglerEngineIdentifier } from '@dw/engines';
import { IDataWranglerOrchestrator } from './variablesView/types';
import { IApplicationShell } from '../../platform/common/application/types';
import { IFileSystem } from '../../platform/common/platform/types';

@injectable()
export class DataWranglerOrchestrator implements IDataWranglerOrchestrator {
    private kernelSession: IKernelSession | undefined;
    public orchestrator: BasicOrchestrator;
    public dataFrame: IDataFrame | undefined;
    public selection: ISelection | undefined;
    private setDfListeners: Array<(df: IDataFrame) => void> = [];
    private setSelectionListeners: Array<(selection: ISelection) => void> = [];
    private setOperationsListeners: Array<(operations: IOperationView[]) => void> = [];

    private title = '';

    private orchestratorComms: IOrchestratorComms = {
        ui: {
            raiseError: (_error: IError) => {
                // TODO
            },
            reset: () => {
                // TODO
            },
            start: (dataFrame: IDataFrame) => {
                this.setDataFrame(dataFrame);
            },
            updateConstants: (_engineConstants: IEngineConstants) => {
                // TODO
            },
            updateDependencies: (_dependencies: IResolvedPackageDependencyMap) => {
                // TODO
            },
            updateOperations: (operations: IOperationView[], _operationContextMenu: WranglerContextMenuItem[]) => {
                this.setOperations(operations);
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateActiveOperation: (_operationKey?: string, _args?: any, _source?: any, _skipPreview?: boolean) => {
                // TODO
            },
            updateHistory: (_historyItems: IHistoryItem[]) => {
                // TODO
            },
            updateActiveHistoryState: (_historyState?: { historyItem?: IHistoryItem; dataFrame?: IDataFrame }) => {
                // TODO
            },
            updateGridCellEdits: (_gridCellEdits: IGridCellEdit[]) => {
                // TODO
            },
            updateDataFrame: (dataFrame: IDataFrame) => {
                this.setDataFrame(dataFrame);
            },
            setPreviewAllTheCode: (_value: boolean) => {
                // TODO
            }
        },

        operations: {
            completePreviewOperation: (dataFrame: IDataFrame) => {
                this.setDataFrame(dataFrame);
            },

            /**
             * Commits an operation.
             */
            completeCommitOperation: (_dataFrame: IDataFrame) => {
                // TODO
            },

            /**
             * Updates the data in the grid.
             */
            completeRejectOperation: (_dataFrame: IDataFrame, _rejectedItem?: IHistoryItem) => {
                // TODO
            },
            completeUndoOperation: (_dataFrame: IDataFrame, _undoneItem: IHistoryItem) => {
                // TODO
            }
        },

        code: {
            execute: async (code: string, options?: ICodeExecutorOptions): Promise<string> => {
                try {
                    const result = await this.kernelSession?.executeCode(code, options);
                    return result ?? '';
                } catch (e) {
                    throw e;
                }
            },

            interrupt: async () => {
                return this.kernelSession?.interrupt();
            }
        }
    };

    public onSetDf(listener: (df: IDataFrame) => void) {
        this.setDfListeners.push(listener);
    }

    public onSelectionChange(listener: (selection: ISelection) => void) {
        this.setSelectionListeners.push(listener);
    }

    public onOperationsChanged(listener: (selection: IOperationView[]) => void) {
        this.setOperationsListeners.push(listener);
    }

    public async exportDataToFile(format?: WranglerDataExportFormat, exportPreview?: boolean) {
        const exportFormatToLabelMap: {
            [key in WranglerDataExportFormat]: {
                label: string;
                fileExtension: string;
            };
        } = {
            [WranglerDataExportFormat.Csv]: {
                label: 'CSV',
                fileExtension: 'csv'
            },
            [WranglerDataExportFormat.Parquet]: {
                label: 'Parquet',
                fileExtension: 'parquet'
            }
        };

        // if no format was provided, pick one from available options
        if (!format) {
            const options = [
                {
                    key: WranglerDataExportFormat.Csv,
                    label: exportFormatToLabelMap.csv.label
                }
            ];

            // feature-flagged options
            options.push({
                key: WranglerDataExportFormat.Parquet,
                label: exportFormatToLabelMap.parquet.label
            });

            // only show dropdown if there's more than one option
            if (options.length > 1) {
                format = (
                    await this.applicationShell.showQuickPick(options, {
                        // TODO@DW: localize
                        title: 'Export Data File Type',
                        placeHolder: 'Select a file type',
                        ignoreFocusOut: true
                    })
                )?.key;
            } else if (options.length === 1) {
                format = options[0].key;
            }

            // if nothing was selected, abort
            if (!format) {
                return;
            }
        }

        const { label, fileExtension } = exportFormatToLabelMap[format];
        await this.exportDataToFileHelper(format, fileExtension, label, !!exportPreview);
    }

    async exportDataToFileHelper(
        format: WranglerDataExportFormat,
        fileExtension: string,
        formatName: string,
        exportPreview: boolean
    ) {
        return await this.applicationShell.withProgress(
            {
                // TODO@DW: localize
                location: vscode.ProgressLocation.Notification,
                title: `Exporting ${formatName} file...`,
                cancellable: true
            },
            async (_, token) => {
                const exportDataTask = this.orchestrator.exportData(
                    format,
                    exportPreview ? this.dataFrame?.historyItem.variableName : undefined
                );
                token.onCancellationRequested(() => exportDataTask.interrupt());

                const data = await exportDataTask;

                if (!data || token.isCancellationRequested) {
                    return;
                }

                let saveDialogUri = vscode.Uri.file(this.title + '.' + fileExtension);

                // note: rather than opening an untitled file here, we must save the file directly due to limitations in the VS Code extension API
                // see https://github.com/microsoft/vscode/issues/32608
                const fileUri = await this.applicationShell.showSaveDialog({
                    defaultUri: saveDialogUri,
                    filters: {
                        [formatName]: [fileExtension]
                    }
                });
                if (fileUri) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await this.fileSystem.writeFile(fileUri, Buffer.from(data));
                }
                return fileUri;
            }
        );
    }

    public setDataFrame(df: IDataFrame) {
        this.dataFrame = df;
        // const preloaded = preloadGridData(df);
        // // eslint-disable-next-line @typescript-eslint/no-floating-promises
        // this.postMessage(DataWranglerMessages.Host.SetDataFrame, preloaded);
        for (const listener of this.setDfListeners) {
            listener(df);
        }
    }

    public setSelection(selection: ISelection) {
        this.selection = selection;
        // const preloaded = preloadGridData(df);
        // // eslint-disable-next-line @typescript-eslint/no-floating-promises
        // this.postMessage(DataWranglerMessages.Host.SetDataFrame, preloaded);
        for (const listener of this.setSelectionListeners) {
            listener(selection);
        }
    }

    public setOperations(operations: IOperationView[]) {
        for (const listener of this.setOperationsListeners) {
            listener(operations);
        }
    }

    public setTitle(title: string) {
        this.title = title;
    }

    public setKernel(kernelSession: IKernelSession) {
        this.kernelSession = kernelSession;
    }

    constructor(
        @inject(IApplicationShell) private applicationShell: IApplicationShell,
        @inject(IFileSystem) private fileSystem: IFileSystem
    ) {
        this.orchestrator = new BasicOrchestrator(
            this.orchestratorComms,
            {
                [WranglerEngineIdentifier.Pandas]: {
                    engine: new PandasEngine()
                }
            },
            {},
            () => LocalizedStrings.Orchestrator,
            formatString,
            'en',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as any
        );
    }
}
