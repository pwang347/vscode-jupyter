import { ArgType } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Datetime args renderer.
 */
const DateTimeArgsRenderer: ArgsRenderer<ArgType.Datetime> = ({
    isPanelDisabled,
    label,
    onChange,
    currentArgState,
    arg,
    inputErrors,
    renderers,
    key
}) => {
    const datetimeFieldRender = renderCustom({
        props: {
            disabled: isPanelDisabled,
            label,
            onChange,
            value: currentArgState[arg.key],
            minValue: arg.options.minValue,
            maxValue: arg.options.maxValue,
            errorMessage: inputErrors?.[arg.key],
            layoutHint: arg.options.layoutHint
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <input
                    aria-labelledby={arg.key + "field"}
                    type="date"
                    value={props.value}
                    min={props.minValue}
                    max={props.maxValue}
                    onChange={(e) => {
                        props.onChange(e.target.value);
                    }}
                />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderDatetimeField
    });
    return [<React.Fragment key={key}>{datetimeFieldRender}</React.Fragment>];
};

export default DateTimeArgsRenderer;
