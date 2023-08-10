import { IHistoryItem } from "./history";
import { IOperationIdentifier } from "./operations";
import { IPerfTrace } from "./trace";
import { TranslationValidationResult, TranslationValidationResultType } from "./translation";

export interface ITelemetryEventData {
    properties?: { [key: string]: unknown };
    measurements?: { [key: string]: number };
}

/**
 * Telemetry logger
 * Based on BaseTelemetryClient https://github.com/microsoft/vscode-extension-telemetry/blob/main/src/node/telemetryReporter.ts
 */
export interface ITelemetryLogger {
    logEvent: (eventName: string, data?: ITelemetryEventData) => void;
    logException: (exception: Error, data?: ITelemetryEventData) => void;
    logPerfTrace: (trace: IPerfTrace, data?: ITelemetryEventData) => void;
}

/**
 * Interface for the telemetry events we want across all implementations
 */
export interface ITelemetryClient extends ITelemetryLogger {
    logSessionStarted: (numRows: number, numColumns: number, engineId: string) => void;
    logOperationPreviewed: (
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        shapeAfter: { rows: number; columns: number },
        codeGenTimeInMS: number,
        codeExecTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) => void;
    logOperationCodeGenerationFailed: (
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        codeGenTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) => void;
    logOperationCodeExecutionFailed: (
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        codeGenTimeInMS: number,
        codeExecTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) => void;
    logOperationCommited: (
        operation: IOperationIdentifier,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) => void;
    logOperationRejected: (operation: IOperationIdentifier) => void;
    logOperationUndone: (operation: IOperationIdentifier) => void;
    logColumnSelected: () => void;
    logExportData: (format: string) => void;
    logExportCode: (format: string) => void;
    logActiveHistoryStateChanged: (numHistoryItems: number, index?: number) => void;
    logTranslationResult: (historyItem: IHistoryItem, validationResult?: TranslationValidationResult) => void;
}

export enum WranglerTelemetryEvents {
    OperationPreviewed = "OperationPreviewed",
    OperationCodeGenerationFailed = "OperationCodeGenerationFailed",
    OperationCodeExecutionFailed = "OperationCodeExecutionFailed",
    OperationCommited = "OperationCommited",
    OperationRejected = "OperationRejected",
    OperationUndone = "OperationUndone",
    SessionStarted = "SessionStarted",
    ColumnSelected = "ColumnSelected",
    ExportData = "ExportData",
    ExportCode = "ExportCode",
    PackageDependenciesResolved = "PackageDependenciesResolved",
    ActiveHistoryStateChanged = "ActiveHistoryStateChanged",
    ApplyButtonClicked = "ApplyButtonClicked",
    DiscardButtonClicked = "DiscardButtonClicked",
    CreatePreviewButtonClicked = "CreatePreviewButtonClicked",
    BackToResultsButtonClicked = "BackToResultsButtonClicked",
    TranslationWarning = "TranslationWarning"
}

/**
 * Abstract base class for the common (across hosts) telemetry events
 * We provide the base class for this to ensure consistent logging across implementations
 */
export abstract class BaseTelemetryClient implements ITelemetryClient {
    public abstract logEvent(eventName: string, data?: ITelemetryEventData): void;
    public abstract logException(exception: Error, data?: ITelemetryEventData): void;
    public abstract logPerfTrace(trace: IPerfTrace): void;

    public logSessionStarted(numRows: number, numColumns: number, engineId: string) {
        this.logEvent(WranglerTelemetryEvents.SessionStarted, {
            measurements: {
                rows: numRows,
                columns: numColumns
            },
            properties: {
                engineId
            }
        });
    }
    public logOperationPreviewed(
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        shapeAfter: { rows: number; columns: number },
        codeGenTimeInMS: number,
        codeExecTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) {
        this.logEvent(WranglerTelemetryEvents.OperationPreviewed, {
            properties: {
                ...properties,
                operationKey: operation.key
            },
            measurements: {
                ...measurements,
                shapeBeforeRows: shapeBefore.rows,
                shapeBeforeColumns: shapeBefore.columns,
                shapeAfterRows: shapeAfter.rows,
                shapeAfterColumns: shapeAfter.columns,
                codeGenTimeInMS,
                codeExecTimeInMS
            }
        });
    }
    public logOperationCodeGenerationFailed(
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        codeGenTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) {
        this.logEvent(WranglerTelemetryEvents.OperationCodeGenerationFailed, {
            properties: {
                ...properties,
                operationKey: operation.key
            },
            measurements: {
                ...measurements,
                shapeBeforeRows: shapeBefore.rows,
                shapeBeforeColumns: shapeBefore.columns,
                codeGenTimeInMS
            }
        });
    }
    public logOperationCodeExecutionFailed(
        operation: IOperationIdentifier,
        shapeBefore: { rows: number; columns: number },
        codeGenTimeInMS: number,
        codeExecTimeInMS: number,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) {
        this.logEvent(WranglerTelemetryEvents.OperationCodeExecutionFailed, {
            properties: {
                ...properties,
                operationKey: operation.key
            },
            measurements: {
                ...measurements,
                shapeBeforeRows: shapeBefore.rows,
                shapeBeforeColumns: shapeBefore.columns,
                codeGenTimeInMS,
                codeExecTimeInMS
            }
        });
    }
    public logOperationCommited(
        operation: IOperationIdentifier,
        properties?: { [key: string]: string },
        measurements?: { [key: string]: number }
    ) {
        this.logEvent(WranglerTelemetryEvents.OperationCommited, {
            properties: {
                ...properties,
                operationKey: operation.key
            },
            measurements
        });
    }
    public logOperationRejected(operation: IOperationIdentifier) {
        this.logEvent(WranglerTelemetryEvents.OperationRejected, {
            properties: {
                operationKey: operation.key
            }
        });
    }
    public logOperationUndone(operation: IOperationIdentifier) {
        this.logEvent(WranglerTelemetryEvents.OperationUndone, {
            properties: {
                operationKey: operation.key
            }
        });
    }
    public logColumnSelected() {
        this.logEvent(WranglerTelemetryEvents.ColumnSelected);
    }
    public logExportData(format: string) {
        this.logEvent(WranglerTelemetryEvents.ExportData, {
            properties: {
                format
            }
        });
    }
    public logExportCode(format: string) {
        this.logEvent(WranglerTelemetryEvents.ExportCode, {
            properties: {
                format
            }
        });
    }
    public logActiveHistoryStateChanged(numHistoryItems: number, index?: number) {
        this.logEvent(WranglerTelemetryEvents.ActiveHistoryStateChanged, {
            measurements: {
                numHistoryItems,
                index: index ?? -1 // denote undefined/latest with -1
            }
        });
    }
    public logTranslationResult(historyItem: IHistoryItem, validationResult?: TranslationValidationResult) {
        if (validationResult?.type === TranslationValidationResultType.Warning) {
            this.logEvent(WranglerTelemetryEvents.TranslationWarning, {
                properties: {
                    operationKey: historyItem.operation.key,
                    warningId: validationResult.id
                }
            });
        }
        if (validationResult?.type === TranslationValidationResultType.MultiWarning) {
            for (const warning of validationResult.warnings) {
                this.logEvent(WranglerTelemetryEvents.TranslationWarning, {
                    properties: {
                        operationKey: historyItem.operation.key,
                        warningId: warning.id
                    }
                });
            }
        }
    }
}
