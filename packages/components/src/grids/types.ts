import {
    IDataFrame,
    IDataFrameRow,
    IGridCellEdit,
    IOperationView,
    ISelection,
    IViewComms,
    IBooleanVisualization,
    IColumnVisualization,
    IDataFrameColumn,
    INumericalVisualization,
    WranglerContextMenuItem,
    ColumnType,
    ITelemetryLogger,
    IHistoryItem
} from "@dw/messaging";
import { LocalizedStrings } from "../localization";
import { IRenderFunction } from "../customRender";

/**
 * Cell context menu grid operations.
 */
export enum CellContextMenuGridOperations {
    CopyCell = "copyCell",
    CopyRows = "copyRows"
}

/**
 * Renderers for grid cells.
 */
export interface ICellRenderers {
    onRenderCellIcon?: IRenderFunction<{
        cellIcon: GridCellIcon;
        iconTooltipText: string;
    }>;
    onRenderLoadingCell?: IRenderFunction<{
        column: IDataFrameColumn;
    }>;
}

/**
 * Renderers for the grid context menu.
 */
export interface IContextMenuRenderers {
    onRenderOperationContextMenuItem?: IRenderFunction<
        {
            key: string;
            menuItem: WranglerContextMenuItem;
            onClick?: () => void;
            disabledReason?: string;
            renderSubMenu: (subMenuItems: WranglerContextMenuItem[]) => void;
        },
        any
    >;
    onRenderHeaderContextMenu?: IRenderFunction<{
        target: Element | Point;
        dismiss: () => void;
        columnIndex: number;
        selection: ISelection;
        operationContextMenuItems: any[];
    }>;
    onRenderCellContextMenu?: IRenderFunction<{
        target: Element | Point;
        dismiss: () => void;
        columnIndex: number;
        rowIndex: number;
        gridOperations: Array<{
            key: string;
            label: string;
            onClick: () => void;
        }>;
    }>;
}

/**
 * Renderer for a text editor.
 */
export type TextEditorRenderer = IRenderFunction<{
    disabled: boolean;
    value: string;
    placeholder: string;
    commit: (value: string, force?: boolean) => void;
    gridRowIndex: number;
    gridColumnIndex: number;
}>;

/**
 * Renderer for a boolean editor.
 */
export type BooleanEditorRenderer = IRenderFunction<{
    disabled: boolean;
    value: boolean;
    commit: (value: boolean) => void;
    gridRowIndex: number;
    gridColumnIndex: number;
}>;

/**
 * Renderer for an integer editor.
 */
export type IntegerEditorRenderer = IRenderFunction<{
    disabled: boolean;
    value: number;
    commit: (value: number) => void;
    gridRowIndex: number;
    gridColumnIndex: number;
}>;

/**
 * Renderer for a float editor.
 */
export type FloatEditorRenderer = IRenderFunction<{
    disabled: boolean;
    value: number;
    commit: (value: number) => void;
    gridRowIndex: number;
    gridColumnIndex: number;
}>;

/**
 * Renderer for a date time editor.
 */
export type DateTimeEditorRenderer = IRenderFunction<{
    disabled: boolean;
    value: Date;
    commit: (value: Date) => void;
    gridRowIndex: number;
    gridColumnIndex: number;
}>;

/**
 * Renderers for the grid editors.
 */
export interface IEditorRenderers {
    onRenderTextEditorCell?: TextEditorRenderer;
    onRenderBooleanEditorCell?: BooleanEditorRenderer;
    onRenderIntegerEditorCell?: IntegerEditorRenderer;
    onRenderFloatEditorCell?: FloatEditorRenderer;
    onRenderDateTimeEditorCell?: DateTimeEditorRenderer;
}

/**
 * Generic type for visualization props
 */
export type VisualizationProps<T extends IColumnVisualization> = {
    visualization: T;
    column: IDataFrameColumn;
    style: IVisualizationStyle;
    locale: string;
    localizedStrings: typeof LocalizedStrings.Visualization;
    enableFocus: boolean;
};

/**
 * Renderer for a boolean visualization.
 */
export type BooleanVisualizationRenderer = IRenderFunction<VisualizationProps<IBooleanVisualization>>;

/**
 * Renderer for a numerical visualization.
 */
export type NumericalVisualizationRenderer = IRenderFunction<VisualizationProps<INumericalVisualization>>;

/**
 * Renderers for the grid visualizations.
 */
export interface IVisualizationRenderers {
    onRenderBooleanVisualization?: BooleanVisualizationRenderer;
    onRenderNumericalVisualization?: NumericalVisualizationRenderer;
}

export interface IVisualizationStyle {
    primaryColor: string;
    secondaryColor: string;
    outlinesOnly: boolean;
    backgroundColor: string;
    foregroundColor: string;
}

/**
 * Types of header labels.
 */
export enum HeaderLabelType {
    Added = "added",
    Removed = "removed",
    Targeted = "targeted",
    Default = "default"
}

/**
 * Renderers for the header.
 */
export interface IHeaderRenderers {
    onRenderHeaderLabel?: IRenderFunction<{
        label: string;
        labelType: HeaderLabelType;
        dataType: ColumnType;
        rawDataType: string;
    }>;
    onRenderOverflowMenuButton?: IRenderFunction<{
        showHeaderContextMenu: (target: Element) => void;
        sortAsc?: boolean;
    }>;
    onRenderCommitButton?: IRenderFunction<{
        disabled: boolean;
        onClick: () => void;
    }>;
}

/**
 * Common props for all wrangler grids.
 */
export interface IWranglerGridProps {
    comms: IViewComms;
    dataFrame?: IDataFrame;
    activeHistoryDataFrame?: IDataFrame;
    operations: IOperationView[];
    operationContextMenu: WranglerContextMenuItem[];
    renderers?: ICellRenderers &
        IContextMenuRenderers &
        IEditorRenderers &
        IHeaderRenderers &
        IVisualizationRenderers & {
            onRenderResetFiltersButton?: IRenderFunction<{ resetFilters: () => void }>;
        };
    gridCellEdits: IGridCellEdit[];
    locale: string;
    localizedStrings: typeof LocalizedStrings.Grid;
    visualizationLocalizedStrings: typeof LocalizedStrings.Visualization;
    hidden?: boolean;
    headerFont?: {
        name: string;
        sizeInPx: number;
        weight: number;
    };
    visualizationStyle?: IVisualizationStyle;
    disableCommitButton?: boolean;
    disabled?: boolean;
    disableFetching?: boolean;
    disableInteractions?: boolean;
    enableEditLastAppliedOperation: boolean;
    historyItems: IHistoryItem[];
    onRowsLoaded?: (rows: IDataFrameRow[]) => void;
    onHeaderContextMenuShown?: (how: "context" | "button") => void;
    onCellContextMenuShown?: () => void;
    telemetryLogger?: ITelemetryLogger;
}

/** Represents a point on the screen. */
export interface Point {
    left?: number;
    top?: number;
}

/** Represents the type of grid cell. */
export enum GridCellIcon {
    EditSuccess = "editSuccess",
    EditFail = "editFail",
    EditSuggested = "editSuggested"
}
