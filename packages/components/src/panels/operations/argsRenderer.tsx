// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { IOperationsPanelArgumentRenderers, IOperationsPanelProps, IOperationsPanelState } from "./types";
import argsRendererMap from "./argsRenderers";
import { ArgsRenderer, IArgsRenderContext } from "./argsRenderers/types";
import DefaultArgsRenderer from "./argsRenderers/defaultArgsRenderer";
import { LocalizedStrings } from "../../localization";
import { addUniqueKeyToArgs } from "./utils";

/**
 * Top-level render function for args based on the selected operation.
 */
export function renderOperationPanelArguments(
    props: IOperationsPanelProps,
    state: IOperationsPanelState,
    setState: (newState: Partial<IOperationsPanelState>) => void,
    startPreview: () => void,
    locStrings: typeof LocalizedStrings.Operations,
    renderers?: IOperationsPanelArgumentRenderers
) {
    if (Object.keys(state.selectedArgs).length === 0 || !state.selectedOperation) {
        return null;
    }
    return (
        <React.Fragment>
            <div style={{display: "flex", flexWrap: "wrap", gap: "0px 5px"}}>
            {state.selectedOperation.args.flatMap((arg) => {
                return renderOperationPanelArgument({
                    arg,
                    isPanelDisabled: !!props.disabled,
                    inputErrors: props.inputErrors,
                    locStrings,
                    dataFrame: state.activeDataFrameHeader,
                    selectedOperation: state.selectedOperation,
                    selectedArgs: state.selectedArgs,
                    setState,
                    startPreview,
                    renderers
                });
            })}
            </div>
        </React.Fragment>
    );
}

/**
 * Recursive render function for args.
 */
export function renderOperationPanelArgument(context: IArgsRenderContext): Array<JSX.Element | null> {
    const { arg, keyOverride, argsStateOverride, selectedArgs, onChangeOverride, setState, startPreview } = context;
    const label = arg.name;
    const key = keyOverride ?? arg.key;
    const currentArgState = argsStateOverride ? argsStateOverride : selectedArgs;
    const onChange = onChangeOverride
        ? onChangeOverride
        : (value: any) => {
              setState({
                  selectedArgs: {
                      ...currentArgState,
                      [arg.key]: addUniqueKeyToArgs(value, key)
                  }
              });
              startPreview();
          };

    console.log("@@@ARG", arg);
    let renderer: ArgsRenderer<any> | null = argsRendererMap[arg.type];
    if (!renderer) {
        renderer = DefaultArgsRenderer;
    }

    console.log("@@OK2", renderer.name, currentArgState);
    return renderer(
        {
            ...context,
            label,
            key,
            currentArgState,
            onChange
        },
        renderOperationPanelArgument
    );
}
