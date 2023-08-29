import {
    IDataFrame,
    IOrchestratorComms,
    ErrorCode,
    ISelection,
    IOperationView,
    IResolvedPackageDependencyMap,
    IRuntimeError,
    ITelemetryClient,
    IErrorValueMapping,
    IGridCellEdit,
    WranglerTelemetryEvents,
    IOperationContextMenuItemIdentifier,
    getTargetedColumns,
    AsyncTask,
    INTERRUPTED_ERROR,
    IHistoryItem,
    ICodeExecutorOptions,
    DataImportOperationKey,
    IExportCodeOptions,
    TranslationValidationResultType
} from '@dw/messaging';
import {
    IDataImportOperation,
    IDataImportOperationWithBaseProgram,
    IOperation,
    IOperationWithBaseProgram,
    OperationCodeGenResultType,
    PreviewStrategy,
    WranglerContextMenuItemWithArgs
} from '../operations/types';
import { IDataWranglerOperationContext, IGetDataImportArgsContext, IWranglerStartSessionBaseContext } from '../context';
import { IDataWranglerOrchestrator } from '../types';
import {
    IWranglerEngine,
    IWranglerEngineConfig,
    IPackageDependencyMap,
    WranglerCodeExportFormat,
    WranglerDataExportFormat,
    IWranglerCodeExportResultMap,
    IWranglerDataExportResultMap,
    IWranglerTranslationEngine
} from '../engines';
import { LocalizedStrings } from '../localization';
import { createHistoryItem, IOrchestratorHistoryItem } from '../history';
import { IProseApiClient } from '../prose';
import { DataWranglerOperationContextMenu } from '../operations/contextMenu';
import CodeExecutionQueue from './codeExecutionQueue';
import BatchedCodeExecutionQueue from './batchedCodeExecutionQueue';
import { ICodeExecutionQueue } from './types';
import { INaturalLanguageClient } from '../naturalLanguage';

const formatErrorStack = (error: Error | IRuntimeError) => {
    return Array.isArray(error.stack) ? error.stack : String(error.stack || '').split('\n');
};

/**
 * The number of rows that will be cached in the client for past cleaning steps.
 */
export const DefaultRowCacheLimit = 100;

/**
 * The default implementation of the data wrangler orchestrator.
 */
export class BasicOrchestrator implements IDataWranglerOrchestrator {
    private historyItems: IOrchestratorHistoryItem[] = [];
    // this is the name of the variable that is wrangled throughout the session
    // note that each history item will be stored as a copy with a separate variable name
    // but the only one visible to the user will be this one
    private variableToWrangle?: string;
    private lastOperationKey?: string;
    private previewHistoryItem?: IOrchestratorHistoryItem;
    private previewTelemetryProps?: {
        properties?: { [key: string]: string };
        measurements?: { [key: string]: number };
    };
    private activeEngine?: IWranglerEngine;
    private resolvedDependencies?: IResolvedPackageDependencyMap;
    private operationContextMenus: { [engineId: string]: DataWranglerOperationContextMenu } = {};
    private operationMap: { [operationKey: string]: IOperationView } = {};
    private codeExecutionQueueMap: { [engineId: string]: ICodeExecutionQueue } = {};

    constructor(
        private comms: IOrchestratorComms,
        private engines: {
            [engineId: string]: {
                engine: IWranglerEngine;
                config?: IWranglerEngineConfig;
                operationOverrides?: { [operationKey: string]: IOperation<typeof LocalizedStrings.Orchestrator> };
                dataImportOperationOverrides?: {
                    [operationKey: string]: IDataImportOperation<any, typeof LocalizedStrings.Orchestrator>;
                };
                getContextMenuLayoutOverride?: (
                    defaultLayout: WranglerContextMenuItemWithArgs[]
                ) => WranglerContextMenuItemWithArgs[];
            };
        },
        private translationEngines: {
            [engineId: string]: {
                engine: IWranglerTranslationEngine;
                config?: IWranglerEngineConfig;
                operationOverrides?: { [operationKey: string]: IOperation<typeof LocalizedStrings.Orchestrator> };
                dataImportOperationOverrides?: {
                    [operationKey: string]: IDataImportOperation;
                };
            };
        },
        private getLocalizedStrings: (locale: string) => typeof LocalizedStrings.Orchestrator,
        private formatString: (key: string, ...args: any[]) => string,
        private locale: string,
        private proseApiClient: IProseApiClient,
        private naturalLanguageClient: INaturalLanguageClient,
        private telemetryClient?: ITelemetryClient
    ) {
        for (const engineId of Object.keys(this.engines)) {
            if (engineId !== this.engines[engineId].engine.id) {
                throw new Error('Failed sanity check: engine ID mismatch');
            }
            const config = this.engines[engineId].config;
            const queue: ICodeExecutionQueue = new CodeExecutionQueue(
                (code: string, options?: ICodeExecutorOptions) => this.comms.code.execute(code, options),
                () => this.comms.code.interrupt()
            );

            // Batching queue wraps the regular client queue
            if (config?.enableCodeBatching) {
                this.codeExecutionQueueMap[engineId] = new BatchedCodeExecutionQueue(
                    (code, options) => queue.execute(code, options),
                    this.engines[engineId].engine,
                    {
                        requestDebounceBatchTime: config.codeBatchingDebounceTimeInMs
                    }
                );
            } else {
                this.codeExecutionQueueMap[engineId] = queue;
            }
        }
    }

    private executeCode(engineId: string, code: string, options?: ICodeExecutorOptions) {
        return this.codeExecutionQueueMap[engineId].execute(code, options);
    }

    private traceTaskWhenDone = (task: AsyncTask<unknown>, properties?: Record<string, string>) => {
        task.finally(() => this.telemetryClient?.logPerfTrace(task.trace(), { properties }));
    };

    /**
     * Disposes the orchestrator.
     */
    public async dispose() {
        for (const engineId of Object.keys(this.engines)) {
            await this.codeExecutionQueueMap[engineId].dispose();
            const engine = this.engines[engineId].engine;
            await engine.dispose();
        }
        this.activeEngine = undefined;
        this.historyItems = [];
    }

    public getVariableToWrangle() {
        return this.variableToWrangle;
    }

    /**
     * Initializes the data wrangler using a function that instantiates the initial history state.
     */
    public startWranglerSession = AsyncTask.factory(
        'startWranglerSession',
        async (
            subtask,
            engine: string,
            operationKey: DataImportOperationKey,
            getDataImportArgs: (context: IGetDataImportArgsContext) => AsyncTask<any>
        ) => {
            // reset all wrangler state
            this.resetSession();

            // set the active engine - if it's undefined after this then it must have failed and we can abort
            await subtask(this.setActiveEngine(engine));
            if (!this.activeEngine) {
                return;
            }

            // generate the start session context
            const defaultVariableName = this.activeEngine.getDefaultVariableName();
            const context: IWranglerStartSessionBaseContext = {
                engineName: this.activeEngine.getName(this.locale),
                defaultVariableName,
                locale: this.locale,
                getLocalizedStrings: this.getLocalizedStrings,
                formatString: this.formatString
            };

            const dataImportArgs = await subtask(
                getDataImportArgs({
                    ...context,
                    ...{
                        getRelativePath: this.activeEngine.getRelativePath?.bind(this.activeEngine)
                    }
                })
            );
            const dataImportOperation = this.getDataImportOperation(this.activeEngine, operationKey);
            // treat any operation defined outside of the known keys as custom operations
            const isCustomOperation = !Object.values(DataImportOperationKey).includes(operationKey as any);
            if (!dataImportOperation) {
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    {
                        innerError: `Could not find operation '${operationKey}' for engine '${this.activeEngine.id}'`,
                        operationKey
                    },
                    'Start session',
                    true
                );
                return;
            }

            const generateCodeStartTime = Date.now();
            let result;
            try {
                result = await subtask(
                    dataImportOperation.generateCode({ ...context, ...{ args: dataImportArgs } }),
                    'generateCode'
                );
            } catch (e) {
                if (e === INTERRUPTED_ERROR) {
                    throw e;
                }
                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    {
                        innerError: error.message,
                        operationKey
                    },
                    'Start session',
                    !isCustomOperation, // only keep innerError if it's not a custom operation
                    isCustomOperation ? 'Custom code generation failed' : undefined
                );
                this.telemetryClient?.logOperationCodeGenerationFailed(
                    { key: operationKey },
                    { rows: 0, columns: 0 },
                    Date.now() - generateCodeStartTime,
                    {},
                    {}
                );
                return;
            }

            const generateCodeElapsedTime = Date.now() - generateCodeStartTime;
            // handle non-success cases (either error or incomplete args)
            if (result.result === OperationCodeGenResultType.Failure) {
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    {
                        innerError: result.reason ?? `Code generation failed`,
                        operationKey
                    },
                    'Start session',
                    true // since we control the code generation result type even in custom cases, it should be safe to log errors here
                );
                const { getTelemetryProperties } = result;
                const { properties, measurements } = getTelemetryProperties?.() ?? {};
                this.telemetryClient?.logOperationCodeGenerationFailed(
                    { key: operationKey },
                    { rows: 0, columns: 0 },
                    generateCodeElapsedTime,
                    properties,
                    measurements
                );
                return;
            }

            const {
                getBaseProgram,
                getRuntimeCode,
                getDisplayCode,
                getDescription,
                getExecutionOutputMetadata,
                getPreparationTask,
                variableName,
                fileName
            } = result;

            // in general, we might not want to re-run the code generators when handling localization
            // since they can have unintended side-effects
            // TODO@DW: actually handle localization changes
            const renderedRuntimeCode = getRuntimeCode(this.locale);
            const renderedDisplayCode = getDisplayCode?.(this.locale) ?? renderedRuntimeCode; // default to runtime code
            const renderedDescription = getDescription(this.locale);

            // if no variable name was provided by the callback, use the default one
            const initialVariableName = variableName || defaultVariableName;
            this.variableToWrangle = initialVariableName;

            const newVariableName = this.activeEngine.getHistoryVariableName(0);

            // execute the operation code
            const preparationTask = getPreparationTask
                ? subtask(getPreparationTask(this.activeEngine))
                : AsyncTask.resolve();
            const executeOperationCodePromise = subtask(
                this.executeOperationCode(this.activeEngine, renderedRuntimeCode)
            );

            // create a snapshot of the initial variable and store it into a variable corresponding to the first history item
            const assignDataFramePromise = subtask(
                this.activeEngine.assignDataFrame(this.variableToWrangle, newVariableName)
            );

            // initiate data inspection from the variable
            const inspectPromise = subtask(this.inspectDataFrameVariable(this.activeEngine, newVariableName));

            // propagate operations for the active engine to the UI
            this.updateOperationsInView(this.activeEngine.id);

            // create an initial history
            const loadHistoryItem = createHistoryItem(
                this.historyItems.length,
                newVariableName,
                renderedDisplayCode,
                renderedDescription,
                [],
                [],
                getBaseProgram,
                getRuntimeCode,
                getDisplayCode ?? getRuntimeCode,
                getDescription,
                { key: operationKey, isDataImportOperation: true },
                dataImportArgs
            );

            try {
                await preparationTask;
            } catch (e) {
                if (e === INTERRUPTED_ERROR) {
                    throw e;
                }

                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    {
                        innerError: `${error.name}: ${error.message}`,
                        operationKey
                    },
                    'Start session',
                    false,
                    'Failed to prepare initial session'
                );
                return;
            }

            const executeCodeStartTime = Date.now();
            let truncated: boolean | undefined;
            try {
                const res = await executeOperationCodePromise;
                ({ truncated } = getExecutionOutputMetadata?.(res) ?? {});
                await assignDataFramePromise;
            } catch (e) {
                if (e === INTERRUPTED_ERROR) {
                    throw e;
                }

                const error = e as Error;
                const { getTelemetryProperties } = result;
                const { properties, measurements } = getTelemetryProperties?.() ?? {};
                this.telemetryClient?.logOperationCodeExecutionFailed(
                    { key: operationKey },
                    { rows: 0, columns: 0 },
                    executeCodeStartTime,
                    Date.now() - executeCodeStartTime,
                    properties,
                    measurements
                );
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    {
                        innerError: `${error.name}: ${error.message}`,
                        operationKey
                    },
                    'Start session',
                    false,
                    'Failed to execute initial code'
                );
                return;
            }

            const executeCodeElapsedTime = Date.now() - executeCodeStartTime;
            // wait for the data inspection to complete
            let initialDataFrame;
            try {
                initialDataFrame = await inspectPromise;
            } catch (e) {
                if (e === INTERRUPTED_ERROR) {
                    throw e;
                }

                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataFrameInspectionFailedError,
                    {
                        innerError: error.message,
                        isInitialDataFrame: true,
                        isPreview: false
                    },
                    'Start session',
                    false,
                    'Failed to inspect initial code'
                );
            }

            // if there's no data frame, then it means that the inspection errored out
            if (initialDataFrame) {
                // otherwise, send the inspected data frame to the UI
                initialDataFrame.fileName = fileName;
                initialDataFrame.historyItem = loadHistoryItem.getPayload();
                initialDataFrame.wasInitialDataTruncated = truncated;
                loadHistoryItem.dataFrame = initialDataFrame;

                const { getTelemetryProperties } = result;
                const { properties, measurements } = getTelemetryProperties?.() ?? {};
                this.telemetryClient?.logOperationPreviewed(
                    initialDataFrame.historyItem.operation,
                    { rows: 0, columns: 0 },
                    initialDataFrame.shape,
                    generateCodeElapsedTime,
                    executeCodeElapsedTime,
                    properties,
                    measurements
                );

                this.telemetryClient?.logSessionStarted(
                    initialDataFrame.shape.rows,
                    initialDataFrame.shape.columns,
                    this.activeEngine.id
                );
                this.comms.ui.start(initialDataFrame);

                // update the history
                this.historyItems.push(loadHistoryItem);
                this.updateHistoryItemsInView();
                this.comms.ui.updateActiveHistoryState();
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Code execution helper - if the engine defines a custom executor then use it, otherwise use the default
     * code executor.
     */
    private executeOperationCode(
        engine: IWranglerEngine,
        code: string,
        options?: ICodeExecutorOptions
    ): AsyncTask<string> {
        return (
            engine.customOperationExecutor
                ? engine.customOperationExecutor(code, options)
                : this.executeCode(engine.id, code, options)
        ).withName('executeOperationCode');
    }

    /**
     * Returns true if the specified engine is supported.
     */
    public isEngineSupported(engineId: string) {
        return engineId in this.engines;
    }

    /**
     * Returns the ID of the active engine.
     */
    public getActiveEngine() {
        return this.activeEngine?.id;
    }

    /**
     * Updates the orchestrator's active engine and ensures that the engine dependencies are met.
     */
    private setActiveEngine = AsyncTask.factory(
        'setActiveEngine',
        async (subtask, engineId: string, force: boolean = false) => {
            // check if the engine is supported and if dependencies are met
            // update the active engine only if both of these pass
            if (engineId in this.engines) {
                const { engine, config } = this.engines[engineId];
                const dependencies = {
                    ...engine.packageDependencies,
                    ...config?.packageDependencies
                } as IPackageDependencyMap;

                // make sure we clear out the keys with undefined values
                Object.keys(dependencies).forEach((key) => {
                    if (dependencies[key] === undefined) {
                        delete dependencies[key];
                    }
                });

                // if the engine is already active, no need to do anything
                if (!force && this.activeEngine && this.activeEngine === this.engines[engineId].engine) {
                    await subtask(this.checkEngineDependencies(engineId, engine, dependencies));
                    return;
                }

                // update constants
                this.comms.ui.updateConstants({
                    lineCommentPrefix: engine.lineCommentPrefix,
                    displayedPackages: engine.displayedPackages,
                    codeExample: engine.codeExample
                });

                // if we have an existing engine, we should dispose it first (only if we're not restarting it)
                if (this.activeEngine && this.activeEngine.id !== engineId) {
                    await subtask(this.activeEngine.dispose(), 'disposeOldEngine');
                }

                // unset the active engine
                this.activeEngine = undefined;

                // check the actual dependencies
                const engineInitPromise = subtask(
                    engine.init((code, options) => this.executeCode(engineId, code, options), true)
                );

                try {
                    await engineInitPromise;
                    const dependencyCheck = await subtask(this.checkEngineDependencies(engineId, engine, dependencies));
                    // if there are unsatisfied dependencies, we should short-circuit before we set the engine
                    if (!dependencyCheck) {
                        return;
                    }
                } catch (e) {
                    const error = e as Error;
                    return this.raiseError(
                        ErrorCode.UnhandledEngineError,
                        {
                            engineId,
                            innerError: `${error.name}: ${error.message}`
                        },
                        'Set active engine',
                        false,
                        `Failed dependency check - ${error.name}: ${error.message}`
                    );
                }

                // all dependencies met, we can now set the active engine
                this.activeEngine = engine;
            } else {
                return this.raiseError(
                    ErrorCode.UnsupportedEngineError,
                    {
                        engineId
                    },
                    'Set active engine',
                    false,
                    `Failed to set active engine as ${engineId} is unsupported`
                );
            }
        }
    );

    private checkEngineDependencies = AsyncTask.factory(
        'checkEngineDependencies',
        async (subtask, engineId: string, engine: IWranglerEngine, dependencies: IPackageDependencyMap) => {
            try {
                this.resolvedDependencies = await subtask(engine.resolvePackageDependencies(dependencies));
            } catch (e) {
                const error = e as Error;
                this.raiseError(
                    ErrorCode.UnhandledEngineError,
                    {
                        engineId,
                        innerError: `${error.name}: ${error.message}`
                    },
                    'Check engine dependencies',
                    false,
                    `Failed dependency check - ${error.name}: ${error.message}`
                );
                return false;
            }

            this.telemetryClient?.logEvent(WranglerTelemetryEvents.PackageDependenciesResolved, {
                properties: {
                    satisfiedDependencies: JSON.stringify(this.resolvedDependencies.satisfied),
                    unsatisfiedDependencies: JSON.stringify(this.resolvedDependencies.unsatisfied)
                }
            });

            this.comms.ui.updateDependencies(this.resolvedDependencies);

            if (Object.keys(this.resolvedDependencies.unsatisfied).length > 0) {
                this.raiseError(ErrorCode.MissingDependenciesError, {
                    engineId,
                    dependencies: this.resolvedDependencies.unsatisfied
                });
                return false;
            }
            return true;
        }
    );

    /**
     * Clears out UI-related state and notifies the UI to reset.
     */
    public resetSession() {
        this.historyItems = [];
        this.previewHistoryItem = undefined;
        this.lastOperationKey = undefined;
        this.comms.ui.reset();
    }

    /**
     * Propagates current engine operations to the UI.
     */
    public updateOperationsInView(engineId: string) {
        if (!this.resolvedDependencies) {
            throw new Error("Can't update operations since dependencies are not yet resolved");
        }

        const locStrings = this.getLocalizedStrings(this.locale);
        const engine = this.engines[engineId].engine;

        // generate payloads for the operations
        const operations = this.getOperationsViewList(
            locStrings,
            this.engines[engineId].engine.operations,
            this.engines[engineId].operationOverrides
        );

        // create operation context menu instance, which allows us to
        // execute the associated operations at runtime
        this.operationContextMenus[engineId] = new DataWranglerOperationContextMenu(
            {
                engine,
                dependencies: this.resolvedDependencies,
                localizedStrings: locStrings
            },
            this.engines[engineId].getContextMenuLayoutOverride
        );

        this.comms.ui.updateOperations(operations, this.operationContextMenus[engineId].getViewMenuItems());
    }

    /**
     * Helper to create view payloads for the operations. These are data structures that can be used by the UI
     * to render the operation (e.g. in a dropdown).
     */
    private getOperationsViewList(
        locStrings: typeof LocalizedStrings.Orchestrator,
        baseOperationsMap: { [key: string]: IOperation<typeof LocalizedStrings.Orchestrator> | null },
        overrides?: { [key: string]: IOperation<typeof LocalizedStrings.Orchestrator> | null },
        mutateInternalMapping = true
    ) {
        // merge in the overrides
        const operations: IOperationView[] = [];
        const mergedOperations: { [key: string]: IOperation<any> | null } = {
            ...baseOperationsMap,
            ...overrides
        };

        // for each operation, create a new operation view payload
        for (const [operationKey, operation] of Object.entries(mergedOperations)) {
            // if operation was left null, then don't add it to the list
            if (operation === null) {
                continue;
            }
            const operationNameKey = `Operation${operationKey}` as keyof typeof LocalizedStrings.Orchestrator;
            const operationName = operationNameKey in locStrings ? locStrings[operationNameKey] : '';
            const operationHelpTextKey =
                `Operation${operationKey}HelpText` as keyof typeof LocalizedStrings.Orchestrator;
            const operationHelpText =
                operation.getHelpText?.({
                    getLocalizedStrings: this.getLocalizedStrings,
                    locale: this.locale,
                    formatString: this.formatString,
                    variableToWrangle: this.variableToWrangle!
                }) ?? (operationHelpTextKey in locStrings ? locStrings[operationHelpTextKey] : '');

            // don't show the operation if no text is available for it
            if (!operationName || !operationHelpText) {
                continue;
            }

            const operationView: IOperationView = {
                key: operationKey,
                name: operationName,
                helpText: operationHelpText,
                category: operation.category
                    ? locStrings[`OperationCategory${operation.category}` as keyof typeof LocalizedStrings.Orchestrator]
                    : undefined,
                args:
                    operation
                        .getArgs?.({
                            getLocalizedStrings: this.getLocalizedStrings,
                            locale: this.locale,
                            formatString: this.formatString,
                            dependencies: this.resolvedDependencies ?? {
                                satisfied: {},
                                unsatisfied: {}
                            }
                        })
                        ?.map((a) => {
                            const argName = a.name
                                ? a.name
                                : locStrings[
                                      `Operation${operationKey}Args${a.key}` as keyof typeof LocalizedStrings.Orchestrator
                                  ];
                            return {
                                ...a,
                                options: {
                                    targetFilter: operation.defaultTargetFilter,
                                    ...a.options
                                },
                                name: argName
                            };
                        }) ?? []
            };
            operations.push(operationView);

            if (mutateInternalMapping) {
                this.operationMap[operationKey] = operationView;
            }
        }

        return operations;
    }

    /**
     * Helper to inspect data frame variables. Inspection returns headers describing the statistics and column information and additionally
     * fetches table data. If `oldVariableName` and `previewStrategy` is provided, this returns a data frame representing the diff instead.
     */
    private inspectDataFrameVariable(
        engine: IWranglerEngine,
        variableName: string,
        previewStrategy?: PreviewStrategy,
        oldDataFrame?: IDataFrame,
        oldVariableName?: string
    ): AsyncTask<IDataFrame> {
        return oldVariableName && previewStrategy
            ? engine.inspectDataFrameVariableDiff(variableName, oldVariableName, previewStrategy, oldDataFrame)
            : engine.inspectDataFrameVariable(variableName, oldDataFrame);
    }

    /**
     * Update locale. This is primarily used for rendering operation descriptions.
     */
    public updateLocale(locale: string) {
        this.locale = locale;
        for (const historyItem of this.historyItems) {
            historyItem.localize(locale);
        }
        this.updateHistoryItemsInView();
        if (this.activeEngine) {
            // TODO@DW: localization isn't propagated correctly with extension operations
            this.updateOperationsInView(this.activeEngine.id);
        }
    }

    /**
     * Helper to update the history items in the UI.
     */
    private updateHistoryItemsInView() {
        this.comms.ui.updateHistory(this.historyItems.map((h) => h.getPayload()));
    }

    /**
     * Helper to retrieve the latest history item.
     */
    private getLastHistoryItem(activeHistoryIndex?: number) {
        const lastIndex =
            activeHistoryIndex === undefined || activeHistoryIndex === this.historyItems.length
                ? this.historyItems.length - 1
                : activeHistoryIndex - 1;
        return this.historyItems[lastIndex];
    }

    /**
     * Helper to retrieve a data import operation, accounting for extensibility and overrides.
     */
    private getDataImportOperation(
        engine: IWranglerTranslationEngine,
        operationKey: string
    ): IDataImportOperation | null {
        const mergedOperationMap = {
            ...engine.dataImportOperations,
            ...this.engines[engine.id]?.dataImportOperationOverrides
        };
        return mergedOperationMap[operationKey as keyof typeof mergedOperationMap];
    }

    /**
     * Helper to retrieve an operation, accounting for extensibility and overrides.
     */
    private getOperation(
        engine: IWranglerTranslationEngine,
        operationKey: string
    ): IOperation<typeof LocalizedStrings.Orchestrator> | null {
        const mergedOperationMap = {
            ...engine.operations,
            ...this.engines[engine.id]?.operationOverrides
        };
        return mergedOperationMap[operationKey as keyof typeof mergedOperationMap];
    }

    /**
     * Helper to retrieve an engine for translation.
     */
    private getWranglerTranslationEngine(engineId: string) {
        return this.translationEngines[engineId]?.engine ?? this.engines[engineId]?.engine;
    }

    /**
     * Starts previewing an operation.
     */
    public startPreview = AsyncTask.factory(
        'startPreview',
        async (
            subtask,
            operationKey: string,
            args: any,
            dataframe: IDataFrame,
            gridCellEdits: IGridCellEdit[],
            activeHistoryIndex?: number,
            skipCodeExecution?: boolean
        ) => {
            const lastHistoryItem = this.getLastHistoryItem(activeHistoryIndex);
            if (!this.variableToWrangle || !lastHistoryItem || !lastHistoryItem.dataFrame || !this.activeEngine) {
                this.raiseError(
                    ErrorCode.PreviewNotGeneratedError,
                    {
                        innerError: 'Unknown error - Data Wrangler is in a bad state',
                        operationKey
                    },
                    'Start preview',
                    true
                );
                return;
            }

            // get the operation definition
            const operation = this.getOperation(this.activeEngine, operationKey);
            if (!operation) {
                this.raiseError(
                    ErrorCode.PreviewNotGeneratedError,
                    {
                        innerError: `Could not find operation '${operationKey}' for engine '${this.activeEngine.id}'`,
                        operationKey
                    },
                    'Start preview',
                    true
                );
                return;
            }

            // Stop showing all the code
            this.comms.ui.setPreviewAllTheCode(false);

            // update the active operation
            this.comms.ui.updateActiveOperation(operationKey, args, 'preview');

            // create the operation execution context
            const context: IDataWranglerOperationContext<any, typeof LocalizedStrings.Orchestrator> = {
                engineId: this.activeEngine.id,
                engineName: this.activeEngine.getName(this.locale),
                args,
                dataframe,
                gridCellEdits,
                variableName: this.variableToWrangle,
                dependencies: this.resolvedDependencies ?? {
                    satisfied: {},
                    unsatisfied: {}
                },
                locale: this.locale,
                proseApiClient: this.proseApiClient,
                naturalLanguageClient: this.naturalLanguageClient,
                getLocalizedStrings: this.getLocalizedStrings,
                formatString: this.formatString,
                isFirstRun: this.lastOperationKey !== operationKey,
                redactCustomRawType: this.activeEngine.redactCustomRawType,
                stringifyValue: this.activeEngine.stringifyValue
            };
            this.lastOperationKey = operationKey;

            // generate the code
            const generateCodeStartTime = Date.now();
            let result;
            try {
                result = await subtask(operation.generateCode(context), 'generateCode');
            } catch (e) {
                if (e === INTERRUPTED_ERROR) throw e;
                const error = e as Error;
                this.raiseError(
                    ErrorCode.PreviewNotGeneratedError,
                    {
                        innerError: error.message,
                        operationKey
                    },
                    'Start preview',
                    false,
                    'Code generation error: ' + `${error.name} ${error.message}`
                );

                this.telemetryClient?.logOperationCodeGenerationFailed(
                    { key: operationKey },
                    lastHistoryItem.dataFrame.shape,
                    Date.now() - generateCodeStartTime
                );

                // if we were previously in a preview, we should clear it out but keep the selection in the operation panel
                void this.rejectPreview({
                    rejectedDueToError: true,
                    clearOperation: false,
                    restoreToIndex: activeHistoryIndex,
                    error: {
                        name: error.name,
                        message: error.message,
                        stack: formatErrorStack(error)
                    },
                    // preserve the previous grid state if the operation specifies it
                    keepDataFrameState: operation.showOldPreviewOnError
                });
                return;
            }
            const generateCodeElapsedTime = Date.now() - generateCodeStartTime;

            // handle non-success cases (either error or incomplete args)
            if (result.result !== OperationCodeGenResultType.Success) {
                // short-circuit if we found errors in the inputs
                if (result.result === OperationCodeGenResultType.Failure) {
                    this.raiseError(
                        ErrorCode.PreviewNotGeneratedError,
                        {
                            innerError: result.reason,
                            inputErrors: result.inputErrors,
                            operationKey
                        },
                        'Start preview',
                        false,
                        'Code generation failure: ' + result.reason
                    );

                    const { getTelemetryProperties } = result;
                    const { properties, measurements } = getTelemetryProperties?.() ?? {};
                    this.telemetryClient?.logOperationCodeGenerationFailed(
                        { key: operationKey },
                        lastHistoryItem.dataFrame.shape,
                        generateCodeElapsedTime,
                        properties,
                        measurements
                    );

                    // if we were previously in a preview, we should clear it out but keep the selection in the operation panel
                    void this.rejectPreview({
                        rejectedDueToError: true,
                        clearOperation: false,
                        restoreToIndex: activeHistoryIndex,
                        // preserve the previous grid state if the operation specifies it
                        keepDataFrameState: operation.showOldPreviewOnError,
                        error: result.reason
                            ? {
                                  name: '',
                                  message: result.reason ?? '',
                                  stack: []
                              }
                            : undefined
                    });
                } else if (result.result === OperationCodeGenResultType.Incomplete) {
                    this.raiseError(
                        ErrorCode.PreviewNotGeneratedError,
                        {
                            inputErrors: result.inputErrors,
                            operationKey
                        },
                        'Start preview',
                        false,
                        'Code generation incomplete'
                    );
                    void this.rejectPreview({
                        rejectedDueToMissingArguments: true,
                        clearOperation: false,
                        restoreToIndex: activeHistoryIndex
                    });
                }
                return;
            }

            const {
                getBaseProgram,
                getCode,
                getDescription,
                getTelemetryProperties,
                previewStrategy,
                customColumnAnnotations
            } = result;

            // If the operation didn't return column targets, search the args for them.
            let targetedColumns = result.targetedColumns;
            if (!targetedColumns) {
                targetedColumns = getTargetedColumns(args);
            }

            // in general, we might not want to re-run the code generators when handling localization
            // since they can have unintended side-effects
            // TODO@DW: actually handle localization changes
            const renderedCode = getCode(this.locale);
            const renderedDescription = getDescription(this.locale);

            const newVariableName = this.activeEngine.getHistoryVariableName(
                activeHistoryIndex ?? this.historyItems.length
            );

            // create a new history item
            const previewHistoryItem = createHistoryItem(
                activeHistoryIndex !== undefined ? activeHistoryIndex : this.historyItems.length,
                newVariableName,
                renderedCode,
                renderedDescription,
                targetedColumns,
                gridCellEdits,
                getBaseProgram,
                getCode,
                getCode,
                getDescription,
                {
                    key: operationKey
                },
                args
            );

            // if we are skipping code execution, then short-circuit here
            if (skipCodeExecution) {
                void this.rejectPreview({
                    codeGenPreviewHistoryItem: previewHistoryItem,
                    clearOperation: false,
                    restoreToIndex: activeHistoryIndex
                });
                return;
            }

            // set the variable to wrangle to a copy of the previous history item
            const assignDataFrameCopyPromise = subtask(
                this.activeEngine.assignDataFrame(lastHistoryItem.variableName, this.variableToWrangle, {
                    copy: true
                })
            );

            // execute the operation code
            const executeCodeStartTime = Date.now();
            const executeOperationCodePromise = subtask(this.executeOperationCode(this.activeEngine, renderedCode));

            const resultingDataFramePromise = subtask(
                this.inspectDataFrameVariable(
                    this.activeEngine,
                    // Note that we inspect from `variableToWrangle` until the operation is committed.
                    this.variableToWrangle,
                    previewStrategy,
                    lastHistoryItem.dataFrame,
                    lastHistoryItem.variableName
                )
            );

            try {
                await assignDataFrameCopyPromise;
                await executeOperationCodePromise;
            } catch (e) {
                // Cancel other pending tasks.
                await Promise.allSettled([
                    executeOperationCodePromise.interrupt(),
                    resultingDataFramePromise.interrupt()
                ]);

                if (e === INTERRUPTED_ERROR) throw e;
                const { getTelemetryProperties } = result;
                const { properties, measurements } = getTelemetryProperties?.() ?? {};
                this.telemetryClient?.logOperationCodeExecutionFailed(
                    { key: operationKey },
                    lastHistoryItem.dataFrame.shape,
                    generateCodeElapsedTime,
                    Date.now() - executeCodeStartTime,
                    properties,
                    measurements
                );

                const error = e as Error | IRuntimeError;
                // if we were previously in a preview, we should clear it out but keep the selection in the operation panel
                void this.rejectPreview({
                    rejectedDueToError: true,
                    clearOperation: false,
                    error: {
                        executedHistoryItem: previewHistoryItem.getPayload(),
                        name: error.name,
                        message: error.message,
                        stack: formatErrorStack(error)
                    },
                    restoreToIndex: activeHistoryIndex,
                    // preserve the previous grid state if the operation specifies it
                    keepDataFrameState: operation.showOldPreviewOnError
                });
                return;
            }
            const executeCodeElapsedTime = Date.now() - executeCodeStartTime;

            let resultingDataFrame;
            try {
                resultingDataFrame = await resultingDataFramePromise;
            } catch (e) {
                if (e === INTERRUPTED_ERROR) throw e;

                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataFrameInspectionFailedError,
                    {
                        innerError: error.message,
                        isInitialDataFrame: false,
                        isPreview: true,
                        operationKey
                    },
                    'Start preview',
                    false,
                    'Failed to inspect data'
                );
                // if we were previously in a preview, we should clear it out but keep the selection in the operation panel
                void this.rejectPreview({
                    rejectedDueToError: true,
                    clearOperation: false,
                    error: error.message.startsWith('DW_NOT_A_DATAFRAME')
                        ? {
                              executedHistoryItem: previewHistoryItem.getPayload(),
                              name: '',
                              message: this.formatString(
                                  this.getLocalizedStrings(this.locale).NotADataFrameError,
                                  this.variableToWrangle,
                                  // "DW_NOT_A_DATAFRAME".length + 1
                                  error.message.slice(19)
                              ),
                              stack: []
                          }
                        : undefined,
                    restoreToIndex: activeHistoryIndex
                });
                return;
            }

            // save the new history item and send it to the view
            this.previewHistoryItem = previewHistoryItem;

            // attach some extra metadata for the preview
            resultingDataFrame.isPreview = true;
            resultingDataFrame.historyItem = this.previewHistoryItem.getPayload();
            resultingDataFrame.wasInitialDataTruncated = this.historyItems[0].dataFrame?.wasInitialDataTruncated;
            this.previewHistoryItem.previewDataFrame = resultingDataFrame;
            this.previewHistoryItem.previewStrategy = previewStrategy;

            // attach any custom annotations
            if (customColumnAnnotations) {
                resultingDataFrame.columns.forEach((column, index) => {
                    column.annotations = customColumnAnnotations(column, index);
                });
            }
            this.previewTelemetryProps = getTelemetryProperties?.() ?? {};
            const { properties, measurements } = this.previewTelemetryProps;
            this.telemetryClient?.logOperationPreviewed(
                resultingDataFrame.historyItem.operation,
                lastHistoryItem.dataFrame.shape,
                resultingDataFrame.shape,
                generateCodeElapsedTime,
                executeCodeElapsedTime,
                properties,
                measurements
            );
            if (activeHistoryIndex === undefined) {
                this.comms.ui.updateActiveHistoryState();
            }
            this.comms.operations.completePreviewOperation(resultingDataFrame);
        },
        { onCreate: (task, [operationKey]) => this.traceTaskWhenDone(task, { operationKey }) }
    );

    /**
     * Returns operation args for a context menu invocation.
     */
    public getArgsForContextMenu(
        selection: ISelection,
        id: IOperationContextMenuItemIdentifier,
        dataFrame: IDataFrame
    ) {
        const engineId = this.getActiveEngine();
        if (!engineId) {
            this.raiseError(
                ErrorCode.PreviewNotGeneratedError,
                {
                    innerError: 'No active engine',
                    operationKey: id.operationKey
                },
                'Start preview (Get args for context menu)',
                true
            );
            return;
        }
        const args = this.operationContextMenus[engineId]!.computeArgsForMenuOperation(
            id,
            dataFrame,
            selection,
            (operationKey) => {
                return this.operationMap[operationKey];
            }
        );
        return args;
    }

    /**
     * Accepts an operation preview.
     */
    public acceptPreview = AsyncTask.factory(
        'acceptPreview',
        async (subtask) => {
            if (
                !this.previewHistoryItem ||
                !this.variableToWrangle ||
                !this.previewHistoryItem.operation ||
                !this.activeEngine ||
                !this.previewTelemetryProps
            ) {
                return;
            }

            let resultingDataFrame;
            try {
                [, resultingDataFrame] = await Promise.all([
                    // Copy from the wrangling variable to a history variable.
                    subtask(
                        this.activeEngine.assignDataFrame(
                            this.variableToWrangle,
                            this.previewHistoryItem.variableName,
                            {
                                // Delete the wrangling variable so that it is not treated as being overwritten in a new preview.
                                delete: true
                            }
                        )
                    ),
                    subtask(
                        this.inspectDataFrameVariable(
                            this.activeEngine,
                            this.previewHistoryItem.variableName,
                            this.previewHistoryItem.previewStrategy,
                            this.previewHistoryItem.previewDataFrame
                        )
                    )
                ]);
            } catch (e) {
                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataFrameInspectionFailedError,
                    {
                        innerError: error.message,
                        isInitialDataFrame: false,
                        isPreview: false
                    },
                    'Accept preview',
                    false,
                    'Failed to inspect data'
                );
            }

            if (this.previewHistoryItem.previewDataFrame) {
                // Hot-swap the variable name. This assumes the dataframe loader will recognize the change.
                this.previewHistoryItem.previewDataFrame.variableName = this.previewHistoryItem.variableName;
            }

            if (resultingDataFrame) {
                // Clean up the previous history item.
                const lastHistoryItem = this.getLastHistoryItem(this.previewHistoryItem.index);
                if (lastHistoryItem?.dataFrame) {
                    // Only discard row data for the previous operation after we accept the preview.
                    // This lets us quickly return to the previous state if the preview is discarded or invalid.
                    lastHistoryItem.dataFrame.cleanCache({
                        keepRows: DefaultRowCacheLimit
                    });
                }

                resultingDataFrame.historyItem = this.previewHistoryItem.getPayload();
                resultingDataFrame.wasInitialDataTruncated = this.historyItems[0].dataFrame?.wasInitialDataTruncated;
                this.previewHistoryItem.dataFrame = resultingDataFrame;
                this.previewHistoryItem.previewDataFrame?.cleanCache({ keepRows: DefaultRowCacheLimit });
                if (this.previewHistoryItem.index < this.historyItems.length) {
                    this.historyItems[this.previewHistoryItem.index] = this.previewHistoryItem;
                } else {
                    this.historyItems.push(this.previewHistoryItem);
                }
                this.telemetryClient?.logOperationCommited(
                    resultingDataFrame.historyItem.operation,
                    this.previewTelemetryProps.properties,
                    this.previewTelemetryProps.measurements
                );
                this.previewHistoryItem = undefined;
                this.lastOperationKey = undefined;
                this.comms.ui.updateActiveOperation();
                this.comms.ui.updateGridCellEdits([]);
                this.updateHistoryItemsInView();
                this.comms.ui.updateActiveHistoryState();
                this.comms.operations.completeCommitOperation(resultingDataFrame);
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Rejects an operation preview. If clearOperation is set to true, the operation state is also cleared.
     */
    public rejectPreview = AsyncTask.factory(
        'rejectPreview',
        async (
            subtask,
            options?: {
                rejectedDueToMissingArguments?: boolean;
                rejectedDueToError?: boolean;
                codeGenPreviewHistoryItem?: IHistoryItem;
                error?: IRuntimeError & {
                    executedHistoryItem?: IHistoryItem;
                };
                clearOperation?: boolean;
                restoreToIndex?: number;
                keepDataFrameState?: boolean;
            }
        ) => {
            const keepDataFrameState = options?.keepDataFrameState;
            const restoreToIndex = options?.restoreToIndex;

            let restoredHistoryItem;
            // if we intend to revert to the previous state,
            // we first try the most recent preview
            if (keepDataFrameState) {
                if (this.previewHistoryItem) {
                    restoredHistoryItem = this.previewHistoryItem;
                    // if there is no preview, then we should try the preview corresponding to the
                    // the current entry
                } else if (restoreToIndex !== undefined) {
                    restoredHistoryItem = this.historyItems[restoreToIndex];
                }
            }
            // default to the previous history item
            if (!restoredHistoryItem) {
                restoredHistoryItem = this.getLastHistoryItem(restoreToIndex);
            }

            // Clean up the preview dataframe.
            if (this.activeEngine && this.variableToWrangle && restoredHistoryItem !== this.previewHistoryItem) {
                void subtask(this.activeEngine.deleteVariable(this.variableToWrangle));
            }

            if (!this.activeEngine || !restoredHistoryItem) {
                return;
            }

            const rejectedDueToError = options?.rejectedDueToError ?? false;
            const rejectedDueToMissingArguments = options?.rejectedDueToMissingArguments ?? false;
            const codeGenPreviewHistoryItem = options?.codeGenPreviewHistoryItem;
            const error = options?.error;
            const clearOperation = options?.clearOperation ?? true;

            const baseDataFrame = keepDataFrameState
                ? restoredHistoryItem.previewDataFrame
                : restoredHistoryItem.dataFrame;

            if (baseDataFrame) {
                // Make a copy of the last dataframe instead of writing the error properties into the history.
                const resultingDataFrame = {
                    ...baseDataFrame,
                    displayedDueToError: rejectedDueToError || rejectedDueToMissingArguments,
                    displayedDueToMissingArguments: rejectedDueToMissingArguments,
                    codeGenPreviewHistoryItem,
                    // if we're reverting to a previous state on error, make sure we don't display code for it
                    historyItem: keepDataFrameState
                        ? { ...baseDataFrame.historyItem, code: '', description: '' }
                        : baseDataFrame.historyItem,
                    error
                };

                if (restoreToIndex === undefined) {
                    this.comms.ui.updateActiveHistoryState();
                }

                if (clearOperation) {
                    if (this.previewHistoryItem?.operation) {
                        this.telemetryClient?.logOperationRejected(this.previewHistoryItem.operation);
                    }
                    this.previewHistoryItem = undefined;
                    this.lastOperationKey = undefined;
                    this.comms.ui.updateActiveOperation();
                    this.comms.ui.updateGridCellEdits([]);
                    this.comms.operations.completeRejectOperation(resultingDataFrame, this.previewHistoryItem);
                } else {
                    this.comms.operations.completeRejectOperation(resultingDataFrame);
                }
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Undo's the last history operation.
     */
    public undoOperation = AsyncTask.factory(
        'undoOperation',
        async (subtask) => {
            if (this.historyItems.length <= 1 || !this.activeEngine) {
                return;
            }

            const secondLastItem = this.historyItems[this.historyItems.length - 2];
            const resultingDataFrame = secondLastItem.dataFrame;

            if (resultingDataFrame) {
                const undoneItem = this.historyItems.pop();

                // Because we know that the history items length is 2 or more, we can assert undoneItem exists
                if (undoneItem!.operation) this.telemetryClient?.logOperationUndone(undoneItem!.operation);

                // clean up the undone variable
                void subtask(this.activeEngine!.deleteVariable(undoneItem!.variableName));

                this.comms.ui.updateActiveOperation();
                this.comms.ui.updateGridCellEdits([]);
                this.updateHistoryItemsInView();
                this.comms.ui.updateActiveHistoryState();
                this.comms.operations.completeUndoOperation(resultingDataFrame, undoneItem!);
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Registers a custom operation for the given engine.
     */
    public registerCustomOperation(engineId: string, operationKey: string, operation: IOperation) {
        const engineConfig = this.engines[engineId];
        if (!engineConfig) {
            throw new Error(
                `Engine with ID '${engineId}' does not exist. Please make sure you have provided the relevant configurations in the constructor.`
            );
        }
        const existingOperation = this.getOperation(engineConfig.engine, operationKey);
        if (existingOperation) {
            throw new Error(
                `Operation '${operationKey}' already exists for engine '${engineId}'. Please use a different key.`
            );
        }

        // add the newly created operation to the operation override map
        if (!this.engines[engineId].operationOverrides) {
            this.engines[engineId].operationOverrides = {};
        }
        this.engines[engineId].operationOverrides![operationKey] = operation;
    }

    /**
     * Exports data.
     */
    public exportData = AsyncTask.factory(
        'exportData',
        async (
            subtask,
            format: WranglerDataExportFormat,
            variable?: string
        ): Promise<IWranglerDataExportResultMap[WranglerDataExportFormat] | undefined> => {
            const dataExporter = this.activeEngine?.dataExporters?.[format];
            if (!dataExporter || !this.variableToWrangle) {
                this.raiseError(
                    ErrorCode.ExportError,
                    {
                        format,
                        isSupported: false,
                        innerError: !this.variableToWrangle ? 'No variable to wrangle' : 'No data exporter found'
                    },
                    'Export data',
                    true
                );
                return;
            }

            let variableName = undefined;
            try {
                console.log('@@@VARIABLE', variableName, this.variableToWrangle);
                this.telemetryClient?.logExportData(format);
                if (!variable) {
                    variableName = await subtask(
                        this.activeEngine!.evaluateHistory(this.variableToWrangle, this.historyItems)
                    );
                    return await subtask(dataExporter(variableName));
                } else {
                    return await subtask(dataExporter(this.variableToWrangle));
                }
            } catch (e) {
                if (e !== INTERRUPTED_ERROR) {
                    const error = e as Error;
                    this.raiseError(
                        ErrorCode.ExportError,
                        {
                            format,
                            innerError: `${error.name}: ${error.message}`,
                            isSupported: true
                        },
                        'Export data',
                        false,
                        'Unknown export error'
                    );
                }
                return;
            } finally {
                if (variableName) {
                    void this.activeEngine!.deleteVariable(variableName);
                }
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Exports code.
     */
    public exportCode = AsyncTask.factory(
        'exportCode',
        async (
            subtask,
            format: WranglerCodeExportFormat,
            options?: IExportCodeOptions
        ): Promise<IWranglerCodeExportResultMap[WranglerCodeExportFormat] | undefined> => {
            const engine = options?.engineId ? this.getWranglerTranslationEngine(options.engineId) : this.activeEngine;
            if (!engine) {
                this.raiseError(
                    ErrorCode.ExportError,
                    {
                        format,
                        isSupported: false,
                        innerError: 'No engine available for translation'
                    },
                    'Export code',
                    true
                );
                return;
            }

            const codeExporter = engine.codeExporters?.[format];
            if (!codeExporter) {
                this.raiseError(
                    ErrorCode.ExportError,
                    {
                        format,
                        isSupported: false,
                        innerError: 'No code exporter found'
                    },
                    'Export code',
                    true
                );
                return;
            }

            if (!this.variableToWrangle || !this.activeEngine) {
                return;
            }

            let historyItemsToExport: IOrchestratorHistoryItem[] = this.historyItems;
            const originalEngineName = this.activeEngine.getName(this.locale);
            if (options?.engineId && options.engineId !== this.activeEngine.id) {
                const translatedHistoryItems: IOrchestratorHistoryItem[] = [];
                for (const historyItem of this.historyItems) {
                    let code;
                    let validationResult;
                    const description = historyItem.description ?? '';
                    const baseProgram = historyItem.getBaseProgram?.();
                    const operation = historyItem.operation.isDataImportOperation
                        ? this.getDataImportOperation(engine, historyItem.operation.key)
                        : this.getOperation(engine, historyItem.operation.key);
                    if (operation && historyItem.getBaseProgram && (operation.isTranslationSupported ?? true)) {
                        if (
                            historyItem.operation.isDataImportOperation &&
                            (operation as IDataImportOperationWithBaseProgram).generateCodeFromBaseProgram
                        ) {
                            const dataImportOperation = operation as any as IDataImportOperationWithBaseProgram;
                            const context = {
                                originalEngineName,
                                baseProgram: {
                                    ...baseProgram,
                                    variableName: options?.variableName ?? baseProgram?.variableName
                                },
                                getLocalizedStrings: this.getLocalizedStrings,
                                formatString: this.formatString
                            };
                            const { getDisplayCode, getRuntimeCode } =
                                await dataImportOperation.generateCodeFromBaseProgram(context);
                            code = getDisplayCode?.(this.locale) ?? getRuntimeCode(this.locale);
                            validationResult = dataImportOperation.validateBaseProgram?.(context);
                        } else if ((operation as IOperationWithBaseProgram).generateCodeFromBaseProgram) {
                            const transformOperation = operation as any as IOperationWithBaseProgram;
                            const context = {
                                originalEngineName,
                                baseProgram: {
                                    ...baseProgram,
                                    variableName: options?.variableName ?? baseProgram?.variableName
                                },
                                getLocalizedStrings: this.getLocalizedStrings,
                                formatString: this.formatString
                            };
                            const { getCode } = await transformOperation.generateCodeFromBaseProgram(context);
                            code = getCode(this.locale);
                            validationResult = transformOperation.validateBaseProgram?.(context);
                        }
                    }

                    if (
                        validationResult &&
                        (validationResult.type === TranslationValidationResultType.Warning ||
                            validationResult.type === TranslationValidationResultType.MultiWarning)
                    ) {
                        const warningMessages =
                            validationResult.type === TranslationValidationResultType.MultiWarning
                                ? validationResult.warnings.map((warning) => warning.getMessage(this.locale))
                                : [validationResult.getMessage(this.locale)];
                        const warningTemplate = this.getLocalizedStrings(this.locale).OperationWarningCommentTemplate;
                        const warningMessagesAsComments = warningMessages.map(
                            (warningMessage) =>
                                `${engine.lineCommentPrefix}${this.formatString(warningTemplate, warningMessage)}`
                        );
                        code = `${warningMessagesAsComments.join('\n')}${code ? '\n' + code : ''}`;
                    }

                    options.onTranslation?.(
                        historyItem,
                        validationResult ?? { type: TranslationValidationResultType.Success }
                    );

                    if (code !== undefined) {
                        translatedHistoryItems.push({ ...historyItem, code, description });
                    } else {
                        // TODO@DW: add auto-translation here
                        translatedHistoryItems.push({ ...historyItem, code: '', description });
                    }

                    this.telemetryClient?.logTranslationResult(historyItem, validationResult);
                }
                historyItemsToExport = translatedHistoryItems;
            }

            try {
                this.telemetryClient?.logExportCode(format);
                return await subtask(
                    codeExporter(
                        options?.variableName ?? this.variableToWrangle,
                        historyItemsToExport,
                        options?.preCode
                    )
                );
            } catch (e) {
                const error = e as Error;
                this.raiseError(
                    ErrorCode.ExportError,
                    {
                        format,
                        innerError: `${error.name}: ${error.message}`,
                        isSupported: true
                    },
                    'Export code',
                    false,
                    'Unknown code export error'
                );
                return;
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Returns the current orchestrator history list.
     */
    public getHistoryList(): IOrchestratorHistoryItem[] {
        return this.historyItems;
    }

    /**
     * Gets the history state (history item and data frame) from the given index.
     */
    public updateActiveHistoryState(index?: number, enableEditLastAppliedOperation?: boolean): void {
        const extendedHistoryList = this.getHistoryList();
        // normalize the index so that even if we explicitly navigated to the latest item
        // the below paths (including telemetry) are still consistent
        if (index === extendedHistoryList.length) {
            index = undefined;
        }

        let historyItem: IOrchestratorHistoryItem | undefined;
        if (index !== undefined && index < extendedHistoryList.length) {
            historyItem = extendedHistoryList[index];
        }

        // restore previews if we're navigating to them
        if (
            this.previewHistoryItem?.previewDataFrame &&
            (this.previewHistoryItem.index === index ||
                (index === undefined && this.previewHistoryItem.index === this.historyItems.length))
        ) {
            this.comms.ui.updateGridCellEdits(this.previewHistoryItem.gridCellEdits ?? []);
            this.comms.ui.updateActiveOperation(
                this.previewHistoryItem.operation.key,
                this.previewHistoryItem.operationArgs,
                undefined,
                true
            );
            this.comms.ui.updateDataFrame(this.previewHistoryItem.previewDataFrame);
        }
        // if enabled, update the active operation when the last applied operation is selected
        else if (enableEditLastAppliedOperation && index === this.historyItems.length - 1) {
            const item = this.historyItems[this.historyItems.length - 1];
            this.comms.ui.updateGridCellEdits(item.gridCellEdits ?? []);
            this.comms.ui.updateActiveOperation(item.operation.key, item.operationArgs, undefined, true);
            // clear the panel otherwise if we're going to the current step and there isn't a preview
            // if editing last operation is enabled, we can also just reset the active df to ensure consistency
            // with the behaviour when we switch to the current one
        } else if (index === undefined || enableEditLastAppliedOperation) {
            this.comms.ui.updateGridCellEdits([]);
            this.comms.ui.updateActiveOperation();
            if (this.previewHistoryItem?.index !== this.historyItems.length && this.historyItems.length > 0) {
                // this preview history item index isn't for the current item, otherwise it'd be caught above
                // set the main df to the last committed item if the preview df is from a past step
                this.comms.ui.updateDataFrame(this.historyItems[this.historyItems.length - 1].dataFrame!);
            }
        }

        this.telemetryClient?.logActiveHistoryStateChanged(extendedHistoryList.length, index);
        this.comms.ui.setPreviewAllTheCode(false);
        this.comms.ui.updateActiveHistoryState(
            historyItem && {
                historyItem,
                dataFrame: historyItem?.previewDataFrame || historyItem?.dataFrame
            }
        );
    }

    /**
     * Returns the API of the specified engine or the currently active one if unspecified.
     */
    public getEngineApi = AsyncTask.factory('getEngineApi', async (subtask, engineId?: string) => {
        const engine = engineId ? this.engines[engineId].engine : this.activeEngine;
        if (!engine) {
            throw new Error('No corresponding engine');
        }
        await subtask(engine.init((code, options) => this.executeCode(engine.id, code, options)));

        return {
            engineId: engine.id,
            lineCommentPrefix: engine.lineCommentPrefix,
            refresh: () => engine.init((code, options) => this.executeCode(engine.id, code, options), true),
            executeCode: (code: string, options?: ICodeExecutorOptions) =>
                this.executeOperationCode(engine, code, options),
            installerName: engine.dependencyInstallerName,
            installDependency: engine.installDependency.bind(engine),
            setupInstaller: engine.setupDependencyInstaller.bind(engine),
            isInstallerAvailable: engine.isDependencyInstallerAvailable.bind(engine),
            createWranglingCompletion: engine.createWranglingCompletion.bind(engine)
        };
    });

    private raiseError<T extends ErrorCode>(
        code: T,
        value: IErrorValueMapping[T],
        // optional prefix for the inner error
        innerErrorTelemetryPrefix?: string,
        // by default remove the inner error in telemetry
        preserveInnerErrorInTelemetry?: boolean,
        // optionally override the innerError property in telemetry
        // this is just for telemetry purposes so no need to localize
        innerErrorTelemetryOverride?: string
    ) {
        let innerErrorString;
        // if we aren't trying to keep the original inner error property, then
        // we should attempt to use the custom provided message for telemetry
        if (!preserveInnerErrorInTelemetry) {
            innerErrorString = innerErrorTelemetryPrefix
                ? innerErrorTelemetryPrefix + ' > ' + innerErrorTelemetryOverride
                : innerErrorTelemetryOverride;
        } else {
            // otherwise, just see if we need to pre-pend any telemetry prefix
            innerErrorString = innerErrorTelemetryPrefix
                ? innerErrorTelemetryPrefix + ' > ' + value.innerError
                : value.innerError;
        }

        // input errors can include PII in the message; we can just redact the
        // message and check in telemetry which fields were showing the input errors
        const inputErrors: { [key: string]: string } = {};
        if (value.inputErrors) {
            for (const key of Object.keys(value.inputErrors)) {
                inputErrors[key] = '[REDACTED]';
            }
        }

        this.telemetryClient?.logException(new Error(code), {
            properties: {
                errorCode: code,
                ...value,
                ...{ innerError: innerErrorString },
                ...{ inputErrors }
            }
        });
        this.comms.ui.raiseError({
            code,
            value
        });
    }

    /**
     * Reloads the data wrangler state.
     */
    public reload = AsyncTask.factory(
        'reload',
        async (subtask) => {
            if (!this.activeEngine || !this.variableToWrangle) {
                return;
            }
            await subtask(this.setActiveEngine(this.activeEngine.id, true));
            if (!this.activeEngine) {
                return;
            }

            const engine = this.activeEngine;
            const historyItemsToExecute = this.previewHistoryItem
                ? this.historyItems.concat([this.previewHistoryItem])
                : this.historyItems;

            try {
                // TODO@DW: This is good enough to restore things to a working state, but loading data from past steps
                //          may result in errors since the client IDataFrames are still using old references.
                let previousItem: IOrchestratorHistoryItem | undefined;
                for (const historyItem of historyItemsToExecute) {
                    const code = historyItem.getRuntimeCode(this.locale);

                    await Promise.all([
                        // Restore the previous df if this is not the first operation
                        previousItem &&
                            subtask(
                                this.activeEngine.assignDataFrame(previousItem.variableName, this.variableToWrangle, {
                                    copy: true
                                })
                            ),
                        this.executeOperationCode(engine, code),
                        // Loading the preview diff
                        previousItem &&
                            subtask(
                                this.activeEngine.loadDataframePreviewDiff(
                                    this.variableToWrangle,
                                    previousItem.variableName,
                                    historyItem.previewStrategy!
                                )
                            ),
                        // Commit the operation if it is not a preview
                        historyItem !== this.previewHistoryItem &&
                            subtask(
                                this.activeEngine.assignDataFrame(this.variableToWrangle, historyItem.variableName, {
                                    delete: true
                                })
                            )
                    ]);
                    previousItem = historyItem;
                }
            } catch (e) {
                const error = e as Error;
                this.raiseError(
                    ErrorCode.DataLoadFailedError,
                    { innerError: error.message },
                    'Reload',
                    false,
                    'Unknown error during reload'
                );
            }
        },
        { onCreate: (task) => this.traceTaskWhenDone(task) }
    );

    /**
     * Shows all of the code in the code preview panel.
     */
    public previewAllCode(value: boolean): void {
        this.updateActiveHistoryState();
        this.comms.ui.setPreviewAllTheCode(value);
    }

    /**
     * Returns a list of all engines supporting code export.
     */
    public getAllEnginesSupportingCodeExport() {
        const seen = new Set<string>();
        const results: Array<{ id: string; name: string }> = [];
        for (const map of [this.engines, this.translationEngines]) {
            for (const engineId of Object.keys(map)) {
                if (!seen.has(engineId)) {
                    results.push({
                        id: engineId,
                        name: map[engineId].engine.getName(this.locale)
                    });
                    seen.add(engineId);
                }
            }
        }
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }
}
