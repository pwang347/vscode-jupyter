import {
    IViewComms,
    IOperationView,
    IGridCellEdit,
    IArgLayoutHint,
    IDataFrameHeader,
    IHistoryItem,
    ISelection,
    ITelemetryLogger
} from "@dw/messaging";
import { IRenderFunction } from "../../customRender";
import { LocalizedStrings } from "../../localization";

/**
 * State props for the wrangler operations panel.
 */
export interface IOperationsPanelProps {
    comms: IViewComms;
    operations: IOperationView[];
    dataFrameHeader?: IDataFrameHeader;
    gridCellEdits: IGridCellEdit[];
    locStrings?: typeof LocalizedStrings.Operations;
    debouncePreviewTimeInMs?: number;
    renderers?: IOperationsPanelRenderers;
    inputErrors?: { [key: string]: string };
    disabled?: boolean;
    disableCommitAndRejectButtons?: boolean;
    disablePreviewButton?: boolean;
    activeHistoryItem?: IHistoryItem;
    activeHistoryDataFrameHeader?: IDataFrameHeader;
    gridSelection: ISelection;
    onOperationSelected?: (operation: IOperationView, hasFilter: boolean) => void;
    telemetryLogger?: ITelemetryLogger;
    historyItems: IHistoryItem[];
    enableEditLastAppliedOperation: boolean;
    enableAutomaticCodeExecutionForDescribeOp: boolean;
}

/**
 * State for the wrangler operations panel.
 */
export interface IOperationsPanelState {
    activeDataFrameHeader?: IDataFrameHeader;
    searchValue: string;
    selectedOperation?: IOperationView;
    isWaitingForPreview: boolean;
    selectedArgs: { [key: string]: any };
}

/** Props for boolean fields. */
export interface IBooleanFieldProps {
    key: string;
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for text fields. */
export interface IStringFieldProps {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
    multiline: boolean;
    usePreviewButton: boolean;
    placeholder?: string;
    focusOnMount: boolean;
}

/** Props for integer fields. */
export interface IIntegerFieldProps {
    key: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    minValue?: number;
    maxValue?: number;
    step?: number;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for float fields. */
export interface IFloatFieldProps {
    key: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    minValue?: number;
    maxValue?: number;
    step?: number;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for timedelta fields. */
export interface ITimedeltaFieldProps {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for datetime fields. */
export interface IDatetimeFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minValue?: string;
    maxValue?: string;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for category fields. */
export interface ICategoryFieldProps {
    key: string;
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    choices: Array<{ key: string; label: string }>;
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/** Props for arg group fields. */
export interface IArgGroupFieldProps {
    key: string;
    label: string;
    addGroupLabel: string;
    onDeleteGroupButtonClick: (index: number) => void;
    onAddGroupButtonClick: () => void;
    errorMessage?: string;
    subMenuArgs: JSX.Element[];
    disabled: boolean;
}

/** Props for target fields. */
export interface ITargetFieldProps {
    key: string;
    label: string;
    selectedColumnNames: string[];
    multiSelect: boolean;
    onChange: (newSelection: string[]) => void;
    choices: Array<{ key: string; label: string; disabledReason?: string }>;
    errorMessage?: string;
    disabled: boolean;
    disableSelectAll: boolean;
    layoutHint?: IArgLayoutHint;
}

/** Props for formula fields. */
export interface IFormulaFieldProps {
    key: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    examplesLabel: string;
    examples: string[];
    errorMessage?: string;
    layoutHint?: IArgLayoutHint;
    disabled: boolean;
}

/**
 * Custom renderers for args.
 */
export interface IOperationsPanelArgumentRenderers {
    onRenderBooleanField?: IRenderFunction<IBooleanFieldProps>;
    onRenderStringField?: IRenderFunction<IStringFieldProps>;
    onRenderIntegerField?: IRenderFunction<IIntegerFieldProps>;
    onRenderFloatField?: IRenderFunction<IFloatFieldProps>;
    onRenderTimedeltaField?: IRenderFunction<ITimedeltaFieldProps>;
    onRenderDatetimeField?: IRenderFunction<IDatetimeFieldProps>;
    onRenderCategoryField?: IRenderFunction<ICategoryFieldProps>;
    onRenderArgGroupField?: IRenderFunction<IArgGroupFieldProps>;
    onRenderTargetField?: IRenderFunction<ITargetFieldProps>;
    onRenderFormulaField?: IRenderFunction<IFormulaFieldProps>;
}

/**
 * Represents a group of operations.
 */
export interface IOperationGroup {
    label: string;
    operations: IOperationView[];
}

/**
 * Represents an operation.
 */
export interface IOperationItem {
    key: string;
    label: string;
    onClick: () => void;
}

/**
 * Represents operation group llst.
 */
export interface IOperationGroupList {
    groups: Array<{ groupLabel: string; operations: Array<IOperationItem> }>;
    topLevelOperations: Array<IOperationItem>;
}

/**
 * Custom renderers for the operation list view.
 */
export interface IOperationsPanelListViewRenderers {
    onRenderOperationSearch?: IRenderFunction<{
        value: string;
        placeholder: string;
        disabled: boolean;
        onChange: (value: string) => void;
    }>;
    onRenderOperationGroupList?: IRenderFunction<IOperationGroupList>;
    onRenderOperationList?: IRenderFunction<{
        operations: Array<IOperationItem>;
    }>;
}

/**
 * Custom renderers for the operations panel.
 */
export type IOperationsPanelRenderers = IOperationsPanelArgumentRenderers &
    IOperationsPanelListViewRenderers & {
        onRenderBackToResultsButton?: IRenderFunction<{
            label: string;
            onClick: () => void;
        }>;
        onRenderAcceptCodeButton?: IRenderFunction<{
            label: string;
            onClick: () => void;
            disabled: boolean;
        }>;
        onRenderClearPreviewButton?: IRenderFunction<{
            label: string;
            onClick: () => void;
            disabled: boolean;
        }>;
        onRenderPreviewCodeButton?: IRenderFunction<{
            label: string;
            onClick: () => void;
            disabled: boolean;
        }>;
    } & {
        onRenderUpdateButton?: IRenderFunction<{
            label: string;
            isUpdating: boolean;
            onClick: () => void;
            disabled: boolean;
        }>;
    };
