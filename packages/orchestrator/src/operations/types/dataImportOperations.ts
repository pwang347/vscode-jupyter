import { AsyncTask, DataImportOperationKey, IOperationArgView } from "@dw/messaging";
import { LocalizedStrings } from "../../localization";
import { IDataWranglerOperationArgContext, IWranglerStartSessionContext } from "../../context";
import { IBaseProgram, ICommonOperationFailureResult, ICommonOperationSuccessResult } from "./common";
import { IWranglerEngine } from "../../engines";

/**
 * Mapping of data import operations to their engine-specific definitions. If `null` is provided, then
 * the operation is disabled.
 */
export type DataImportOperationMap = { [key in DataImportOperationKey]: IDataImportOperation | null };

/**
 * An operation used in the context of data import.
 */
export interface IDataImportOperation<
    TArgs extends { [key: string]: any } = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /**
     * Given an operation context, generates code to execute as well as the corresponding description.
     */
    generateCode: (
        ctx: IWranglerStartSessionContext<TArgs, TLocType>
    ) => Promise<IDataImportOperationCodeGenResult> | IDataImportOperationCodeGenResult;

    /**
     * Returns list of arguments for the operation. These hints are provided to the UI to figure out what inputs to render
     * and whenever an operation preview is triggered, a snapshot is taken of the input state to serve as arguments
     * for the operation evaluation.
     */
    getArgs?: (ctx: IDataWranglerOperationArgContext<TLocType>) => IOperationArgView[];

    /**
     * Whether translation is not supported using the default translation pipeline. By default, operation translations will
     * be attempted unless specified otherwise.
     */
    isTranslationSupported?: boolean;
}

/**
 * Metadata returned by a data import operation.
 */
export interface IDataImportOperationMetadata {
    truncated?: boolean;
}

/**
 * Payload when code generation succeeds for a data import operation.
 */
export interface IDataImportOperationSuccessResult<TBaseProgram extends IBaseProgram = any>
    extends ICommonOperationSuccessResult<TBaseProgram> {
    /** The resulting variable. */
    variableName?: string;

    /**
     * The original variable name of the dataframe if it was converted.
     */
    originalVariableName?: string;

    /** The source file. */
    fileName?: string;

    /** Getter for task to prepare engine state before the code executes. */
    getPreparationTask?: (engine: IWranglerEngine) => AsyncTask<void>;

    /** Getter for metadata from the execution output. */
    getExecutionOutputMetadata?: (output: string) => IDataImportOperationMetadata;
}

/**
 * Result of generating a base program for a data import operation.
 */
export type IDataImportOperationCodeGenResult<
    TBaseProgram extends IBaseProgram = any,
    TArgs extends { [key: string]: any } = any
> =
    | (IDataImportOperationSuccessResult<TBaseProgram> & {
          /**
           * The actual executed code.
           */
          getRuntimeCode: (locale: string) => string;

          /**
           *
           * The displayed code.
           *
           * Note that "runtime" code may differ from "display" code in that it can optimize the loading with parameters specific to DW.
           * This must produce a similar result to the "display" code so that there are no errors when the generated code is run.
           *
           * For example, getRuntimeCode could return `df = loadCSV(filename, max_rows)` to limit the number of rows loaded into DW
           * whereas getDisplayCode would return `df = loadCSV(filename)` to load all of the data when the user runs the exported code.
           */
          getDisplayCode?: (locale: string) => string;
      })
    | ICommonOperationFailureResult<TArgs>;
