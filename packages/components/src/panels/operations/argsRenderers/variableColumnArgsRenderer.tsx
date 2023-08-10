import { ArgType, IOperationArgView } from "@dw/messaging";
import { ArgsRenderer } from "./types";

/**
 * Variable column args renderer. This arg will render using the default renderer for the current column type.
 */
const VariableColumnArgsRenderer: ArgsRenderer<ArgType.VariableColumnType> = (
    context,
    renderOperationPanelArgument
) => {
    const { typeContext, arg } = context;
    if (!typeContext) {
        return [];
    }
    const newArg: IOperationArgView = {
        key: arg.key,
        type: typeContext as any,
        name: arg.name,
        options: arg.options[typeContext] ?? {}
    };
    return renderOperationPanelArgument({
        ...context,
        arg: newArg
    });
};

export default VariableColumnArgsRenderer;
