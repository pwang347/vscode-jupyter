import { AsyncTask, ColumnType, IDataFrame, IGridCellEdit, IResolvedPackageDependencyMap } from "@dw/messaging";
import { LocalizedStrings } from "./localization";
import { INaturalLanguageClient } from "./naturalLanguage";
import { IProseApiClient } from "./prose";

/**
 * Context for operation execution.
 */
export interface IDataWranglerOperationContext<
    TArgs = any, // note: engine implementations can specify this to strongly type their arguments
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /**
     * ID of the current engine.
     */
    engineId: string;

    /**
     * Name of the current engine.
     */
    engineName: string;

    /**
     * Argument payload received from the UI.
     */
    args: TArgs;

    /**
     * Current data frame.
     */
    dataframe: IDataFrame;

    /**
     * Edits present in the grid.
     */
    gridCellEdits: IGridCellEdit[];

    /**
     * The variable name.
     */
    variableName: string;

    /**
     * The current locale. This can be useful for providing localized error messages during code generation.
     */
    locale: string;

    /**
     * The currently installed dependencies.
     */
    dependencies: IResolvedPackageDependencyMap;

    /**
     * Getter for localized strings.
     */
    getLocalizedStrings: (locale: string) => TLocType;

    /**
     * String formatter for localization.
     */
    formatString: (key: string, ...args: any) => string;

    /**
     * PROSE API client.
     */
    proseApiClient: IProseApiClient;

    /**
     * Natural language client.
     */
    naturalLanguageClient: INaturalLanguageClient;

    /**
     * Whether this was the first time the operation ran.
     */
    isFirstRun: boolean;

    /**
     * Redacts custom raw types.
     */
    redactCustomRawType: (rawType: string) => string;

    /**
     * Stringifies a value.
     */
    stringifyValue: (value: any, type?: ColumnType) => string;
}

/**
 * Context for operation view initialization.
 */
export interface IDataWranglerOperationViewContext<
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /**
     * The current locale. This can be useful for providing localized error messages during code generation.
     */
    locale: string;

    /**
     * The working variable name.
     */
    variableToWrangle: string;

    /**
     * Getter for localized strings.
     */
    getLocalizedStrings: (locale: string) => TLocType;

    /**
     * String formatter for localization.
     */
    formatString: (key: string, ...args: any) => string;
}

/**
 * Context for operation arg initialization.
 */
export interface IDataWranglerOperationArgContext<
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /**
     * The current locale. This can be useful for providing localized error messages during code generation.
     */
    locale: string;

    /**
     * The currently installed dependencies.
     */
    dependencies: IResolvedPackageDependencyMap;

    /**
     * Getter for localized strings.
     */
    getLocalizedStrings: (locale: string) => TLocType;

    /**
     * String formatter for localization.
     */
    formatString: (key: string, ...args: any) => string;
}

export interface IWranglerStartSessionBaseContext<
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /**
     * Name of the engine.
     */
    engineName: string;

    /**
     * The suggested variable name to use for a new data wrangler session.
     */
    defaultVariableName: string;

    /**
     * The current locale. This can be useful for providing localized error messages during code generation.
     */
    locale: string;

    /**
     * Getter for localized strings.
     */
    getLocalizedStrings: (locale: string) => TLocType;

    /**
     * String formatter for localization.
     */
    formatString: (key: string, ...args: any) => string;
}

/**
 * Context for starting sessions.
 */
export interface IWranglerStartSessionContext<
    TArgs = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends IWranglerStartSessionBaseContext<TLocType> {
    /**
     * Additional args.
     */
    args: TArgs;
}

/**
 * Context for getting data import args.
 */
export interface IGetDataImportArgsContext<
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends IWranglerStartSessionBaseContext<TLocType> {
    getRelativePath?: (newDirectory: string) => AsyncTask<string>;
}

/**
 * Context for generating code from base program for an operation.
 */
export interface IOperationWithBaseProgramContext<
    TBaseProgram,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    originalEngineName: string;
    baseProgram: TBaseProgram;
    getLocalizedStrings: (locale: string) => TLocType;
    formatString: (key: string, ...args: any) => string;
}

/**
 * Context for generating code from base program for a data import operation.
 */
export interface IDataImportOperationWithBaseProgramContext<
    TBaseProgram,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    originalEngineName: string;
    baseProgram: TBaseProgram;
    getLocalizedStrings: (locale: string) => TLocType;
    formatString: (key: string, ...args: any) => string;
}
