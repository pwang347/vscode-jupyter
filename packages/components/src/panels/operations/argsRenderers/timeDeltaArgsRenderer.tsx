import { ArgType } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Timedelta args renderer.
 */
const TimeDeltaArgsRenderer: ArgsRenderer<ArgType.Timedelta> = ({
    arg,
    isPanelDisabled,
    inputErrors,
    label,
    key,
    onChange,
    currentArgState,
    renderers
}) => {
    const timedeltaFieldRender = renderCustom({
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
                <input
                    aria-labelledby={arg.key + "field"}
                    type="number"
                    value={props.label}
                    onChange={(e) => {
                        props.onChange(e.target.value);
                    }}
                />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderTimedeltaField
    });
    return [<React.Fragment key={key}>{timedeltaFieldRender}</React.Fragment>];
};

export default TimeDeltaArgsRenderer;
