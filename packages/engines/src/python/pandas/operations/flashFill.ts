import { OperationCategory, OperationKey } from "@dw/orchestrator";
import { FlashFillOperationBase } from "../../../core/operations/flashFill";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";
import { WranglerEngineIdentifier } from "../../../types";
import { redactRawType } from "./util";

const engineId = WranglerEngineIdentifier.Pandas;

function getFlashFillOperation(options?: {
    category?: OperationCategory;
    exampleTransformer?: (value: string) => any;
}) {
    return extendBaseOperation(FlashFillOperationBase, {
        config: {
            category: options?.category,
            exampleTransformer: options?.exampleTransformer,
            redactRawType
        },
        translateBaseProgram: (ctx) => {
            const { variableName: df, insertIndex, newColumnName, derivedCode } = ctx.baseProgram;

            if (derivedCode && engineId in derivedCode) {
                return {
                    getCode: () => derivedCode[engineId]!
                };
            }

            // since we don't have any examples to learn on yet, just return a program that creates an empty column
            const newName = escapeSingleQuote(newColumnName);
            return {
                /**
                 * Example: derive column with no examples
                 * ```
                 * df.insert(4, 'Name_derived',  df.apply(lambda row : "", axis=1))
                 * ```
                 */
                getCode: () =>
                    [`${df}.insert(${insertIndex}, '${newName}', ${df}.apply(lambda row : "", axis=1))`].join("\n")
            };
        }
    });
}

export default {
    [OperationKey.StringTransformByExample]: getFlashFillOperation({ category: OperationCategory.Format }),
    [OperationKey.DateTimeFormattingByExample]: getFlashFillOperation({ category: OperationCategory.Format }),
    // TODO@DW: re-investigate if we can enable Arithmetic by Example as the feature grows on the PROSE side
    [OperationKey.ArithmeticByExample]: null,
    [OperationKey.NewColumnByExample]: getFlashFillOperation()
};
