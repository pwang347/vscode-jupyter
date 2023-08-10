import { ArgType } from "@dw/messaging";
import { ArgsRenderer } from "./types";

/**
 * Type-dependent args renderer. This arg type handles cases where we want to show different sub-args based on the type of the currently selected column.
 */
const TypeDependentArgsRenderer: ArgsRenderer<ArgType.TypeDependent> = (context, renderOperationPanelArgument) => {
    const { typeContext, arg, currentArgState, onChange, key } = context;
    if (!typeContext) {
        return [];
    }
    return arg.options[typeContext].flatMap(
        (a) =>
            renderOperationPanelArgument({
                ...context,
                arg: a,
                onChangeOverride: (value: any) => {
                    const values = { ...currentArgState[arg.key] };
                    values[a.key] = value;
                    onChange(values);
                },
                argsStateOverride: currentArgState[arg.key],
                keyOverride: key + "_" + a.key
            }) || []
    );
};

export default TypeDependentArgsRenderer;
