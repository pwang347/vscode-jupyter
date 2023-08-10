import {
    IDataImportOperationWithBaseProgramContext,
    IDataWranglerOperationContext,
    IOperationWithBaseProgramContext,
    IWranglerStartSessionContext
} from "../../context";
import { LocalizedStrings } from "../../localization";
import { IBaseProgram, ICommonOperationFailureResult, ICommonOperationIncompleteResult } from "./common";
import { IDataImportOperation, IDataImportOperationSuccessResult } from "./dataImportOperations";
import { IOperation, IOperationSuccessResult } from "./operations";
import { TranslationValidationResult } from "@dw/messaging";

/**
 * Result of converting from base program to code for an operation.
 */
export interface IOperationWithBaseProgramResult {
    /**
     * The displayed and executed code.
     */
    getCode: (locale: string) => string;
}

/**
 * An operation with support for base programs.
 */
export interface IOperationWithBaseProgram<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends IOperation<TArgs, TLocType>,
        IGenericOperation<TArgs, TBaseProgram, TLocType> {
    /**
     * Given a base program, generates the corresponding code.
     */
    generateCodeFromBaseProgram: (
        ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
    ) => IOperationWithBaseProgramResult;

    /**
     * Validates the input base program and optionally returns warning messages.
     * If not implemented, returns a successful validation by default.
     */
    validateBaseProgram?: (
        ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
    ) => TranslationValidationResult;
}

/**
 * Defines a framework/language-agnostic operation.
 */
export interface IGenericOperation<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends Omit<IOperation<TArgs, TLocType>, "generateCode"> {
    /**
     * Given an operation context, generates a language/framework-agnostic representation of a program along with
     * constant metadata such as the code description.
     */
    generateBaseProgram: (
        ctx: IDataWranglerOperationContext<TArgs, TLocType>
    ) =>
        | Promise<IOperationBaseProgramGenResult<TBaseProgram, TArgs>>
        | IOperationBaseProgramGenResult<TBaseProgram, TArgs>;
}

/**
 * Result of generating a base program for an operation.
 */
export type IOperationBaseProgramGenResult<
    TBaseProgram extends IBaseProgram = any,
    TArgs extends { [key: string]: any } = any
> =
    | IOperationSuccessResult<TBaseProgram>
    | ICommonOperationFailureResult<TArgs>
    | ICommonOperationIncompleteResult<TArgs>;

/**
 * Result of converting from base program to code for a data import operation.
 */
export interface IDataImportOperationWithBaseProgramResult {
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
}

/**
 * A data import operation with support for base programs.
 */
export interface IDataImportOperationWithBaseProgram<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends IDataImportOperation<TArgs, TLocType>,
        IGenericDataImportOperation<TArgs, TBaseProgram, TLocType> {
    /**
     * Given an operation context, generates code to execute as well as the corresponding description.
     */
    generateCodeFromBaseProgram: (
        ctx: IDataImportOperationWithBaseProgramContext<TBaseProgram, TLocType>
    ) => IDataImportOperationWithBaseProgramResult;

    /**
     * Validates the input base program and optionally returns warning messages.
     * If not implemented, returns a successful validation by default.
     */
    validateBaseProgram?: (
        ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
    ) => TranslationValidationResult;
}

/**
 * Defines a framework/language-agnostic data import operation.
 */
export interface IGenericDataImportOperation<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> extends Omit<IDataImportOperation<TArgs, TLocType>, "generateCode"> {
    /**
     * Given an operation context, generates a language/framework-agnostic representation of a program along with
     * constant metadata such as the code description.
     */
    generateBaseProgram: (
        ctx: IWranglerStartSessionContext<TArgs, TLocType>
    ) =>
        | Promise<IDataImportOperationBaseProgramGenResult<TBaseProgram>>
        | IDataImportOperationBaseProgramGenResult<TBaseProgram>;
}

/**
 * Result of generating a base program for a data import operation.
 */
export type IDataImportOperationBaseProgramGenResult<
    TBaseProgram extends IBaseProgram = any,
    TArgs extends { [key: string]: any } = any
> = IDataImportOperationSuccessResult<TBaseProgram> | ICommonOperationFailureResult<TArgs>;
