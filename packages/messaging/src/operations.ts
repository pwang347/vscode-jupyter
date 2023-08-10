import { IDataFrameRow } from "./dataframe";
import { ColumnType } from "./datatypes";

/**
 * Represents a way to identify an operation
 */
export interface IOperationIdentifier {
    /** Unique identifier for the operation. */
    key: string;

    /** True if is data import operation. Defaults to false. */
    isDataImportOperation?: boolean;
}

/**
 * Represents an operation payload.
 */
export interface IOperationView extends IOperationIdentifier {
    /** Displayed name. */
    name: string;

    /** Displayed help text. */
    helpText: string;

    /** Displayed category text. */
    category?: string;

    /** List of arguments. */
    args: IOperationArgView[];
}

/**
 * Represents an operation argument payload.
 */
export interface IOperationArgView<T extends ArgType = ArgType> {
    /** Unique identifier for the operation argument. */
    key: string;

    /** Type of the operation argument. */
    type: T;

    /** Displayed name. */
    name: string;

    /** Options for rendering. */
    options: IArgOptionMapping[T];
}

/**
 * Type of argument.
 */
export enum ArgType {
    Target = "target",

    /** Group of arguments. */
    ArgGroup = "argGroup",

    /** Input type will depend on the column type. */
    VariableColumnType = "variableColumnType",

    /** Args will be expanded based on the column type. */
    TypeDependent = "typeDependent",

    /** Provide an editor to write a formula. */
    Formula = "formula",

    /** Provide preset list of strings to choose from. */
    Category = "category",

    /** String primitive type. */
    String = "string",

    /** Boolean primitive type. */
    Boolean = "boolean",

    /** Integer primitive type. */
    Integer = "integer",

    /** Float primitive type. */
    Float = "float",

    /** Datetime type. */
    Datetime = "datetime",

    /** Timedelta type. */
    Timedelta = "timedelta"
}

/**
 * Mapping of arguments to their corresponding customizations.
 */
export interface IArgOptionMapping {
    [ArgType.Target]: ITargetOptions;
    [ArgType.ArgGroup]: IArgGroupOptions;
    [ArgType.VariableColumnType]: IVariableColumnTypeArgOptions;
    [ArgType.TypeDependent]: ITypeDependentArgOptions;
    [ArgType.Formula]: IFormulaArgOptions;
    [ArgType.Category]: ICategoryArgOptions;
    [ArgType.String]: IStringArgOptions;
    [ArgType.Boolean]: IBooleanArgOptions;
    [ArgType.Integer]: IIntegerArgOptions;
    [ArgType.Float]: IFloatArgOptions;
    [ArgType.Datetime]: IDatetimeArgOptions;
    [ArgType.Timedelta]: ITimedeltaArgOptions;
}

/**
 * Represents a column target.
 */
export interface IColumnTarget {
    key: string;
    name: string;
    index: number;
}

/**
 * Options for target args.
 */
export interface ITargetOptions {
    /** Filter for targets. */
    targetFilter?: ITargetFilter;

    /** Items to be rendered after the target selector. This is helpful to create a closure with information of the selected column. */
    subMenu?: IOperationArgView[];

    /** Have all targets selected by default. */
    selectAllByDefault?: boolean;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;

    /** When the target changes, don't reset the sub fields to their default values but instead use the previous values if the types are the same. */
    keepSubMenuStateOnTargetChange?: boolean;
}

/**
 * Options for arg group args.
 */
export interface IArgGroupOptions {
    /** Args in the group. */
    args: IOperationArgView[];

    /** Display string for the add group button. */
    addGroupLabel: string;

    /** If enabled, targets will be sequentially filled. */
    sequentiallyFillTargets?: boolean;

    /** Number of targets to offset for sequential filling. */
    sequentiallyFillTargetsOffset?: number;
}

/**
 * Options for variable column type args.
 */
export type IVariableColumnTypeArgOptions = {
    /** Allow configurations based on the actual selected type. */
    [key in ArgType]?: IArgOptionMapping[key];
};

/**
 * Options for type-dependent args.
 */
export type ITypeDependentArgOptions = {
    /** Map the column type to the desired args. */
    [key in ColumnType]: IOperationArgView[];
};

/** Options for formula args. */
export interface IFormulaArgOptions {
    /** A custom default value. */
    default?: string;

    /** Optional examples to show in tooltip. */
    examples?: string[];

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Represents an edited grid value. This is sent directly from the grid.
 */
export interface IGridCellEdit {
    /** The edited value. */
    value: any;

    /** The row location of the edit. */
    row: number;

    /** The column location of the edit. */
    column: number;

    /** Optional row data. */
    rowData?: IDataFrameRow;
}

/**
 * Layout hint for argument rendering.
 */
export enum IArgLayoutHint {
    /** Argument should take up its own line and expand to fill the width. */
    Block = "Block",
    /** Argument should take its own line, but only grow to fit its content. */
    Fit = "Fit",
    /** Argument should be laid out inline like text. */
    Inline = "Inline",
    /** Argument should be laid out inline, but multiple args on one line should grow to fill the full width. */
    InlineGrow = "InlineGrow"
}

export type StringArgType = string;

/**
 * Options for string args.
 */
export interface IStringArgOptions {
    /** A custom default value. */
    default?: string;

    /** If true, check if the field value is already a column name - if it is, add a unique suffix. */
    isUniqueColumnName?: boolean;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;

    /** If true, don't update previews on edit until the preview button is clicked. */
    usePreviewButton?: boolean;

    /** If true, the text box should be multiline. */
    multiline?: boolean;

    /** Optional text placeholder. */
    placeholder?: string;

    /** If true, the text box will automatically focus on mount. */
    focusOnMount?: boolean;
}

/**
 * Options for boolean args.
 */
export interface IBooleanArgOptions {
    /** A custom default value. */
    default?: boolean;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Options for integer args.
 */
export interface IIntegerArgOptions {
    /** A custom default value. */
    default?: number;

    /** Suggested increment step size. */
    step?: number;

    /** Minimum supported value. */
    minValue?: number;

    /** Maximum supported value. */
    maxValue?: number;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Options for float args.
 */
export interface IFloatArgOptions {
    /** A custom default value. */
    default?: number;

    /** Suggested increment step size. */
    step?: number;

    /** Minimum supported value. */
    minValue?: number;

    /** Maximum supported value. */
    maxValue?: number;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Options for datetime args.
 */
export interface IDatetimeArgOptions {
    /** A custom default value. Stored in ISO format. */
    default?: string;

    /** Minimum supported value. Stored in ISO format. */
    minValue?: string;

    /** Maximum supported value. Stored in ISO format. */
    maxValue?: string;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Options for timedelta args.
 */
export interface ITimedeltaArgOptions {
    /** A custom default value. Represents milliseconds. */
    default?: number;

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Options for category args.
 */
export interface ICategoryArgOptions {
    /** A custom default key value. Defaults to the first entry otherwise. */
    default?: string;

    /** List of available choices. */
    choices: Array<{ key: string; label: string }>;

    /** Placeholder text to show before a selection is made. Overrides the default behavior to be empty. */
    placeholder?: string;

    /** Submenus based on the selected category. */
    subMenuByChoice?: {
        [key in string]?: IOperationArgView[];
    };

    /** Optional layout hint. */
    layoutHint?: IArgLayoutHint;
}

/**
 * Represents a grid selection state. All selections are ordered by order of selection.
 * This means that the latest (or primary) selection is always at the end of a list.
 */
export interface ISelection {
    /** Selected columns. */
    columns: IColumnSelection[];

    /** Selected rows. */
    rows: IRowSelection[];

    /** True if the entire table is selected. */
    isEntireTableSelected: boolean;

    /** Focused cell. */
    activeCell?: {
        row: IRowSelection;
        column: IColumnSelection;
    };
}

/**
 * Represents a selected row, giving an identifier for the grid row and the dataframe row
 */
export interface IRowSelection {
    gridIndex: number;
    dataframeIndex: any;
}

/**
 * Represents a selected column, giving an identifier for the grid column and the dataframe column name
 */
export interface IColumnSelection {
    name: string;
    key: string;
    index: number;
}

/**
 * Helper to create an operation argument payload.
 */
export function createArg<T extends ArgType>(
    key: string,
    type: T,
    options?: IArgOptionMapping[T],
    name?: string
): IOperationArgView {
    return {
        key,
        type,
        options: options ?? {},
        name: name ?? "" // note: arguments are sometimes localized using their keys
    };
}

/**
 * Filters when targeting.
 */
export interface ITargetFilter {
    /** Whether this operation is a single column target only. */
    isSingleTarget?: boolean;

    /**
     * List of supported data types for this operation. This is a hint for the UI to not display this operation if
     * the targeted column is unsupported. Note that this affects column operations only.
     */
    allowedTypes?: ColumnType[];

    /**
     * List of supported data types for this operation. This is a hint for the UI to not display this operation if
     * the targeted column is unsupported. Note that this affects column operations only.
     */
    allowedRawTypes?: string[];

    /** Whether this operation allows "unknown" column types. */
    allowUnknownType?: boolean;

    /** Whether this operation allows mixed column types. */
    allowMixedType?: boolean;

    /** Whether this operation requires all columns to be of the same type. */
    requiresSameType?: boolean;
}
