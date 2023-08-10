import { ArgType } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Boolean args renderer.
 */
const BooleanArgsRenderer: ArgsRenderer<ArgType.Boolean> = ({
    isPanelDisabled,
    label,
    onChange,
    currentArgState,
    inputErrors,
    arg,
    renderers,
    key
}) => {
    const booleanFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            onChange,
            value: currentArgState[arg.key],
            errorMessage: inputErrors?.[arg.key],
            layoutHint: arg.options.layoutHint
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <input aria-labelledby={arg.key + "field"} type="checkbox" checked={props.value} />
            </div>
        ),
        customRender: renderers?.onRenderBooleanField
    });
    return [<React.Fragment key={key}>{booleanFieldRender}</React.Fragment>];
};

export default BooleanArgsRenderer;
