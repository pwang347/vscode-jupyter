import { ArgType } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * String args renderer.
 */
const stringArgsRenderer: ArgsRenderer<ArgType.String> = ({
    arg,
    label,
    isPanelDisabled,
    inputErrors,
    key,
    onChange,
    currentArgState,
    renderers
}) => {
    const stringFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            onChange,
            value: currentArgState[arg.key],
            errorMessage: inputErrors?.[arg.key],
            layoutHint: "layoutHint" in arg.options ? arg.options.layoutHint : undefined,
            multiline: Boolean(arg.options?.multiline),
            usePreviewButton: Boolean(arg.options?.usePreviewButton),
            placeholder: arg.options?.placeholder,
            focusOnMount: Boolean(arg.options?.focusOnMount)
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <input aria-labelledby={arg.key + "field"} value={props.value} />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderStringField
    });
    return [<React.Fragment key={key}>{stringFieldRender}</React.Fragment>];
};

export default stringArgsRenderer;
