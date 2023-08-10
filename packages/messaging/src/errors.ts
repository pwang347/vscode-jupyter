import { IOperationIdentifier } from "./operations";
import { IPackageDependency } from "./dependencies";

/**
 * Known error codes.
 */
export enum ErrorCode {
    UnsupportedEngineError = "unsupportedEngineError",
    DataFrameInspectionFailedError = "dataFrameInspectionFailedError",
    MissingDependenciesError = "missingDependenciesError",
    DataLoadFailedError = "dataLoadFailedError",
    PreviewNotGeneratedError = "previewNotGeneratedError",
    ExportError = "exportError",
    UnhandledEngineError = "unhandledEngineError",
    UnknownError = "unknownError",
    NoKernelSession = "noKernelSession"
}

interface IErrorBase {
    innerError?: string;
}

/**
 * Mapping of errors to their corresponding payload types.
 */
export interface IErrorValueMapping {
    [ErrorCode.UnsupportedEngineError]: IErrorBase & { engineId: string };
    [ErrorCode.DataFrameInspectionFailedError]: IErrorBase & {
        isInitialDataFrame: boolean;
        isPreview: boolean;
        operationKey?: string;
    };
    [ErrorCode.MissingDependenciesError]: IErrorBase & {
        engineId: string;
        dependencies: {
            [packageName: string]: IPackageDependency;
        };
    };
    [ErrorCode.DataLoadFailedError]: IErrorBase & {
        operationKey?: string;
    };
    [ErrorCode.PreviewNotGeneratedError]: IErrorBase & {
        inputErrors?: { [key: string]: string };
        operationKey: string;
    };
    [ErrorCode.ExportError]: IErrorBase & {
        format: string;
        isSupported: boolean;
    };
    [ErrorCode.UnhandledEngineError]: IErrorBase & {
        engineId: string;
    };
    [ErrorCode.UnknownError]: IErrorBase & any;
    [ErrorCode.NoKernelSession]: IErrorBase;
}

/**
 * A known wrangler error.
 */
export interface IError<T extends ErrorCode = ErrorCode> {
    code: T;
    value: IErrorValueMapping[T];
}

/** Represents a runtime error thrown during code execution. */
export interface IRuntimeError {
    name: string;
    message: string;
    stack: string[];
}
