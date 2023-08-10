import { ArgType, IArgOptionMapping } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Formula args renderer.
 */
const FormulaArgsRenderer: ArgsRenderer<ArgType.Formula> = ({
    arg,
    dataFrame,
    label,
    isPanelDisabled,
    inputErrors,
    key,
    onChange,
    currentArgState,
    renderers,
    locStrings
}) => {
    if (!dataFrame) {
        return [];
    }
    const errorMessage = inputErrors?.[arg.key] ?? dataFrame.error ? locStrings.FormulaErrorMessage : undefined;
    const options = arg.options as IArgOptionMapping[ArgType.Formula];
    const formulaFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            onChange,
            value: currentArgState[arg.key],
            errorMessage,
            layoutHint: "layoutHint" in arg.options ? arg.options.layoutHint : undefined,
            examplesLabel: locStrings.FormulaExamplesText,
            examples: options.examples ?? []
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <input aria-labelledby={arg.key + "field"} value={props.value} />
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderFormulaField
    });
    return [<React.Fragment key={key}>{formulaFieldRender}</React.Fragment>];
};

export default FormulaArgsRenderer;
