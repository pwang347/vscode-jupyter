import {
    IColumnTarget,
    IDataFrameColumn,
    IOperationArgView,
    IPreviewColumnAnnotation,
    ITargetFilter,
    OperationKey,
    PreviewStrategy
} from "@dw/messaging";
import {
    IDataWranglerOperationArgContext,
    IDataWranglerOperationContext,
    IDataWranglerOperationViewContext
} from "../../context";
import { LocalizedStrings } from "../../localization";
import {
    IBaseProgram,
    ICommonOperationFailureResult,
    ICommonOperationIncompleteResult,
    ICommonOperationSuccessResult,
    OperationCategory
} from "./common";

/**
 * An operation to be defined by an engine. When the UI issues a request to preview an operation, the corresponding
 * operation object uses the current context (e.g. selected columns, locale, operation arguments) to generate the code
 * to run as well as a description.
 */
export interface IOperation<
    TArgs extends { [key: string]: any } = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
> {
    /** The type of operation. */
    category?: OperationCategory;

    /**
     * Given an operation context, generates code to execute as well as the corresponding description.
     */
    generateCode: (
        ctx: IDataWranglerOperationContext<TArgs, TLocType>
    ) => Promise<IOperationCodeGenResult<TArgs>> | IOperationCodeGenResult<TArgs>;

    /**
     * Gets the help text for this operation.
     */
    getHelpText?: (ctx: IDataWranglerOperationViewContext<TLocType>) => string;

    /**
     * Returns list of arguments for the operation. These hints are provided to the UI to figure out what inputs to render
     * and whenever an operation preview is triggered, a snapshot is taken of the input state to serve as arguments
     * for the operation evaluation.
     */
    getArgs?: (ctx: IDataWranglerOperationArgContext<TLocType>) => IOperationArgView[];

    /** Fallback target filter if unspecified for args. */
    defaultTargetFilter?: ITargetFilter;

    /** Whether to show the old preview on error. Useful for Flash Fill scenarios. */
    showOldPreviewOnError?: boolean;

    /**
     * Whether translation is not supported using the default translation pipeline. By default, operation translations will
     * be attempted unless specified otherwise.
     */
    isTranslationSupported?: boolean;
}

/**
 * Payload when code generation succeeds for an operation.
 */
export interface IOperationSuccessResult<TBaseProgram extends IBaseProgram = any>
    extends ICommonOperationSuccessResult<TBaseProgram> {
    /**
     * The columns targeted by this operation for callout in the UI.
     * If not specified, all column targets present anywhere in the args will be used.
     */
    targetedColumns?: IColumnTarget[];

    /** Strategy used for previewing the dataframe. */
    previewStrategy: PreviewStrategy;

    /** Additional annotations or annotation overrides for a column, such as for labeling noteworthy cells. */
    customColumnAnnotations?: (column: IDataFrameColumn, index: number) => IPreviewColumnAnnotation | undefined;
}

/**
 * Result of generating code for an operation.
 */
export type IOperationCodeGenResult<TArgs extends { [key: string]: any } = any> =
    | (IOperationSuccessResult & {
          /** Getter for the resulting code. Note that we allow localization in case of inline comments. */
          getCode: (locale: string) => string;
      })
    | ICommonOperationFailureResult<TArgs>
    | ICommonOperationIncompleteResult<TArgs>;

/**
 * Mapping of operations to their engine-specific definitions. If `null` is provided, then
 * the operation is disabled.
 */
export type OperationMap = { [key in OperationKey]: IOperation | null };
