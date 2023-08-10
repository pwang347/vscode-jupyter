import * as React from "react";
import { ArgType } from "@dw/messaging";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Float args renderer.
 */
const FloatArgsRenderer: ArgsRenderer<ArgType.Float> = ({
    arg,
    label,
    key,
    onChange,
    currentArgState,
    isPanelDisabled,
    inputErrors,
    renderers
}) => {
    const floatFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            onChange,
            value: currentArgState[arg.key],
            minValue: arg.options.minValue,
            maxValue: arg.options.maxValue,
            step: arg.options.step,
            errorMessage: inputErrors?.[arg.key],
            layoutHint: arg.options.layoutHint
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <input
                    aria-labelledby={arg.key + "field"}
                    type="number"
                    value={props.label}
                    step={props.step}
                    min={props.minValue}
                    max={props.maxValue}
                    onChange={(e) => {
                        props.onChange(parseFloat(e.target.value));
                    }}
                />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderFloatField
    });
    return [<React.Fragment key={key}>{floatFieldRender}</React.Fragment>];
};

export default FloatArgsRenderer;
