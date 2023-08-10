import * as React from "react";
import { ArgType } from "@dw/messaging";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Integer args renderer.
 */
const IntegerArgsRenderer: ArgsRenderer<ArgType.Integer> = ({
    arg,
    label,
    isPanelDisabled,
    inputErrors,
    key,
    onChange,
    currentArgState,
    renderers
}) => {
    const integerFieldRender = renderCustom({
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
                    step={props.step}
                    min={props.minValue}
                    max={props.maxValue}
                    onChange={(e) => {
                        props.onChange(parseInt(e.target.value, 10));
                    }}
                />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderIntegerField
    });
    return [<React.Fragment key={key}>{integerFieldRender}</React.Fragment>];
};

export default IntegerArgsRenderer;
