import {
    ArgType,
    ColumnType,
    IDataFrameColumn,
    IDataFrameHeader,
    IOperationArgView,
    IOperationView
} from "@dw/messaging";
import { LocalizedStrings } from "../../../localization";
import { IOperationsPanelArgumentRenderers, IOperationsPanelState } from "../types";

/**
 * Context used to render arguments.
 */
export interface IArgsRenderContext<TArg extends ArgType = ArgType> {
    arg: IOperationArgView<TArg>;
    isPanelDisabled: boolean;
    inputErrors?: { [key: string]: string };
    locStrings: typeof LocalizedStrings.Operations;
    dataFrame?: IDataFrameHeader;
    selectedOperation?: IOperationView;
    selectedArgs: { [key: string]: any };
    setState: (newState: Partial<IOperationsPanelState>) => void;
    startPreview: () => void;
    renderers?: IOperationsPanelArgumentRenderers;
    onChangeOverride?: (value: any) => void;
    argsStateOverride?: { [key: string]: any };
    keyOverride?: string;
    typeContext?: ColumnType;
    targetsContext?: IDataFrameColumn[];
}

/**
 * These are additional parameters computed prior to the render call for convenience.
 */
export interface IArgsRenderContextHelpers {
    label: string;
    key: string;
    currentArgState: { [key: string]: any };
    onChange: (value: any) => void;
}

/**
 * Argument renderer function.
 */
export type ArgsRenderer<TArg extends ArgType> = (
    renderContext: IArgsRenderContext<TArg> & IArgsRenderContextHelpers,
    renderOperationPanelArgument: (context: IArgsRenderContext) => Array<JSX.Element | null>
) => Array<JSX.Element | null>;

/**
 * Mapping of arg type to renderer.
 */
export type ArgsRendererMap = {
    [key in ArgType]: ArgsRenderer<key> | null;
};
