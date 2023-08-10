import { ArgType, getDefaultArgs } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Arg group args renderer.
 */
const ArgGroupArgsRenderer: ArgsRenderer<ArgType.ArgGroup> = (context, renderOperationPanelArgument) => {
    const { arg, currentArgState, onChange, key, isPanelDisabled, dataFrame, inputErrors, label, renderers } = context;
    const subMenuArgsRendered = (currentArgState[arg.key]?.children ?? []).map((_: any, idx: number) =>
        arg.options.args.flatMap((a) =>
            renderOperationPanelArgument({
                ...context,
                arg: a,
                onChangeOverride: (value: any) => {
                    const newArgsBase = [...currentArgState[arg.key].children];
                    newArgsBase[idx] = { ...newArgsBase[idx], [a.key]: value };
                    onChange({
                        children: newArgsBase
                    });
                },
                argsStateOverride: currentArgState[arg.key].children[idx],
                keyOverride: key + "_" + a.key
            })
        )
    );
    const argGroupFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            addGroupLabel: arg.options.addGroupLabel,
            onDeleteGroupButtonClick: (index) => {
                onChange({
                    children: (currentArgState[arg.key]?.children ?? []).filter((_a: any, idx: number) => idx !== index)
                });
            },
            onAddGroupButtonClick: () => {
                if (!dataFrame) {
                    return;
                }
                const newSubArg = getDefaultArgs(dataFrame, arg.options.args, []);
                onChange({
                    children: (currentArgState[arg.key]?.children ?? []).concat([newSubArg])
                });
            },
            errorMessage: inputErrors?.[arg.key],
            subMenuArgs: subMenuArgsRendered
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                {props.subMenuArgs.map((a, idx) => {
                    return (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div>{a}</div>
                            <button onClick={() => props.onDeleteGroupButtonClick(idx)}>x</button>
                        </div>
                    );
                })}
                <button onClick={props.onAddGroupButtonClick}>{props.addGroupLabel}</button>
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderArgGroupField
    });
    return [<React.Fragment key={key}>{argGroupFieldRender}</React.Fragment>];
};

export default ArgGroupArgsRenderer;
