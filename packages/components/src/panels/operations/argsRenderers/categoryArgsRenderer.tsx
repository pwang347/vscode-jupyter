import { ArgType, getDefaultArgs, IOperationArgView } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Category args renderer.
 */
const CategoryArgsRenderer: ArgsRenderer<ArgType.Category> = (context, renderOperationPanelArgument) => {
    const {
        arg,
        currentArgState,
        onChange,
        isPanelDisabled,
        label,
        dataFrame,
        targetsContext,
        inputErrors,
        renderers,
        key
    } = context;
    const selectedCategory = currentArgState[arg.key].value;
    let subMenuArgs: IOperationArgView[] = arg.options.subMenuByChoice?.[selectedCategory] ?? [];
    const subMenuArgsRendered = subMenuArgs.flatMap((a) =>
        renderOperationPanelArgument({
            ...context,
            arg: a,
            onChangeOverride: (value) => {
                const newArgsBase = { ...currentArgState[arg.key].subMenu, [a.key]: value };
                onChange({
                    key: currentArgState[arg.key].key,
                    value: currentArgState[arg.key].value,
                    subMenu: newArgsBase
                });
            },
            argsStateOverride: currentArgState[arg.key].subMenu,
            keyOverride: key + "_" + a.key
        })
    );
    const categoryFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            choices: arg.options.choices,
            onChange: (value) => {
                if (!dataFrame) {
                    return;
                }
                const subMenuArgs: IOperationArgView[] = arg.options.subMenuByChoice?.[value] || [];
                const result = {
                    key: currentArgState[arg.key].key,
                    value,
                    subMenu: {}
                };
                if (subMenuArgs.length > 0) {
                    result.subMenu = getDefaultArgs(dataFrame, subMenuArgs, targetsContext ?? []);
                }
                onChange(result);
            },
            value: selectedCategory,
            placeholder: arg.options.placeholder,
            errorMessage: inputErrors?.[arg.key],
            layoutHint: arg.options.layoutHint
        },
        defaultRender: (props) => (
            <div>
                <div>{props.label}</div>
                <select
                    aria-labelledby={arg.key + "field"}
                    value={props.value}
                    placeholder={props.placeholder}
                    onChange={(e) => props.onChange(e.target.value)}
                >
                    {props.choices.map((c) => {
                        return <option>{c.label}</option>;
                    })}
                </select>
                <div>{props.errorMessage}</div>
            </div>
        ),
        customRender: renderers?.onRenderCategoryField
    });
    return [<React.Fragment key={key}>{categoryFieldRender}</React.Fragment>, ...subMenuArgsRendered];
};

export default CategoryArgsRenderer;
