// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    IViewComms,
    ISelection,
    IGridCellEdit,
    getDataFrameLoader,
    IDataFrameRow,
    IDataFrameStats,
    IDataFrameColumnStats,
    IOperationContextMenuItemIdentifier,
    DeferredTask,
    INTERRUPTED_ERROR
} from '@dw/messaging';
import { v4 } from 'uuid';
import { PostOffice } from '../react-common/postOffice';
import { WranglerDataExportFormat } from '@dw/orchestrator';
import { DataWranglerMessages } from '../../extension-side/dataviewer/dataWranglerMessages';

export class WranglerPostOffice extends PostOffice implements IViewComms {
    private loadedRowHandlers = new Map<string, DeferredTask<IDataFrameRow[]>>();
    private loadedStatsHandlers = new Map<string, DeferredTask<IDataFrameStats>>();
    private loadedColumnStatsHandlers = new Map<string, DeferredTask<IDataFrameColumnStats>>();

    constructor() {
        super();
        this.addHandler({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handleMessage: (type: string, payload?: any): boolean => {
                switch (type) {
                    case DataWranglerMessages.Host.LoadRows:
                        this.loadedRowHandlers.get(payload.requestId)?.resolve(payload.data);
                        this.loadedRowHandlers.delete(payload.requestId);
                        break;
                    case DataWranglerMessages.Host.LoadStats:
                        this.loadedStatsHandlers.get(payload.requestId)?.resolve(payload.stats);
                        this.loadedStatsHandlers.delete(payload.requestId);
                        break;
                    case DataWranglerMessages.Host.LoadColumnStats:
                        this.loadedColumnStatsHandlers.get(payload.requestId)?.resolve(payload.columnStats);
                        this.loadedColumnStatsHandlers.delete(payload.requestId);
                        break;
                }
                return true;
            }
        });
    }

    /**
     * Wraps a data frame header to add getters for the rows.
     */
    public linkDataFrame(serialized: DataWranglerMessages.ISerializedDataFrame) {
        if (!serialized) {
            return serialized;
        }

        // TODO@DW: There is a potential slow memory leak if requests are not responded to.
        //          Ideally we should track when dataframes are no longer used, and cancel any pending requests.

        const { __rows, __stats, __columnStats, ...header } = serialized;
        return getDataFrameLoader(
            header,
            {
                loadRows: (cursor, { start, end }) => {
                    const requestId = v4();
                    const task = new DeferredTask<IDataFrameRow[]>(() => {
                        this.loadedRowHandlers.delete(requestId);
                        task.reject(INTERRUPTED_ERROR);
                    }, 'webviewLoadRows');
                    this.loadedRowHandlers.set(requestId, task);
                    this.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.LoadRows, {
                        requestId,
                        start,
                        end
                    });
                    return task.then((rows) => ({ rows, cursor }));
                },
                loadStats: () => {
                    const requestId = v4();
                    const task = new DeferredTask<IDataFrameStats>(() => {
                        this.loadedStatsHandlers.delete(requestId);
                        task.reject(INTERRUPTED_ERROR);
                    }, 'webviewLoadStats');
                    this.loadedStatsHandlers.set(requestId, task);
                    this.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.LoadStats, {
                        requestId
                    });
                    return task;
                },
                loadColumnStats: (columnIndex: number) => {
                    const requestId = v4();
                    const task = new DeferredTask<IDataFrameColumnStats>(() => {
                        this.loadedColumnStatsHandlers.delete(requestId);
                        task.reject(INTERRUPTED_ERROR);
                    }, 'webviewLoadColumnStats');
                    this.loadedColumnStatsHandlers.set(requestId, task);
                    this.sendMessage<DataWranglerMessages.IWebviewMapping>(
                        DataWranglerMessages.Webview.LoadColumnStats,
                        {
                            requestId,
                            columnIndex
                        }
                    );
                    return task;
                },
                getCursorForRow: () => undefined
            },
            {
                rows: __rows,
                stats: __stats,
                columnStats: __columnStats
            }
        );
    }

    export = {
        data: {
            toFile: async (_format: WranglerDataExportFormat) => {
                // this.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.ExportData, {
                //     format
                // });
            }
        },
        code: {
            toFunctionCode: async () => {
                // this.postMessage(WranglerMessaging.Webview.ExportCodeToNotebook);
            }
        }
    };

    clipboard = {
        copyFunctionCode: async () => {
            // this.postMessage(WranglerMessaging.Webview.CopyCodeToClipboard);
        }
    };

    operations = {
        previewOperation: async (
            _operationKey: string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            _args: any,
            _activeHistoryIndex?: number,
            _skipCodeExecution?: boolean
        ) => {
            // TODO
        },
        commitOperation: async () => {
            // TODO
        },
        rejectOperation: async () => {
            // TODO
        },
        undoOperation: async () => {
            // TODO
        }
    };

    ui = {
        updateSelection: (_selection: ISelection) => {
            // TODO
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateOperation: (_operationKey: string, _operationArgs?: any) => {
            // TODO
        },
        updateOperationUsingContextMenu: (_id: IOperationContextMenuItemIdentifier, _selection: ISelection) => {
            // TODO
        },
        updateEditedCells: (_gridCellEdits: IGridCellEdit[]) => {
            // TODO
        },
        updateActiveHistoryIndex: (_index?: number) => {
            // TODO
        },
        setPreviewAllTheCode: (_flag: boolean) => {
            // TODO
        }
    };
}
