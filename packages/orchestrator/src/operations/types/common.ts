/** Common properties of all base programs. */
export interface IBaseProgram {
    variableName: string;
}

/**
 * Type of operation.
 */
export enum OperationCategory {
    Formulas = "Formulas",
    Schema = "Schema",
    FindAndReplace = "FindAndReplace",
    Format = "Format",
    SortAndFilter = "SortAndFilter",
    Numeric = "Numeric"
}

/**
 * Type of result from an operation code generation call.
 */
export enum OperationCodeGenResultType {
    Success = "Success",
    Failure = "Failure",
    Incomplete = "Incomplete"
}

/**
 * Common payload when code generation succeeds for an operation.
 */
export interface ICommonOperationSuccessResult<TBaseProgram extends IBaseProgram> {
    /** Code successfully generated. */
    result: OperationCodeGenResultType.Success;

    /** Getter for the resulting description. */
    getDescription: (locale: string) => string;

    /** Optional getter for telemetry properties. */
    getTelemetryProperties?: () => {
        properties?: { [key: string]: string };
        measurements?: { [key: string]: number };
    };

    /** Optional getter for a framework/language-independent representation of the program. */
    getBaseProgram?: () => TBaseProgram;
}

/**
 * Base payload when code generation fails for an operation.
 */
export interface ICommonOperationFailureResult<TArgs> {
    /** Code failed to generate. */
    result: OperationCodeGenResultType.Failure;

    /** Error reason. */
    reason?: string;

    /** Error messages associated with a particular operation argument. */
    inputErrors?: {
        [key in keyof TArgs]?: string;
    };

    /** Optional getter for telemetry properties. */
    getTelemetryProperties?: () => {
        properties?: { [key: string]: string };
        measurements?: { [key: string]: number };
    };
}

/**
 * Common payload when code generation is marked as incomplete for an operation.
 */
export interface ICommonOperationIncompleteResult<TArgs extends { [key: string]: any } = any> {
    /**
     * Some required operation arguments are missing.
     * Generated code should not be executed.
     * Always resets the preview state.
     */
    result: OperationCodeGenResultType.Incomplete;

    /** Error messages associated with a particular operation argument. */
    inputErrors?: {
        [key in keyof TArgs]?: string;
    };
}
