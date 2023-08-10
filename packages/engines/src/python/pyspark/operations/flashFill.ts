import { OperationCategory, OperationKey } from "@dw/orchestrator";
import { FlashFillOperationBase } from "../../../core/operations/flashFill";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";
import { WranglerEngineIdentifier } from "../../../types";

const engineId = WranglerEngineIdentifier.PySpark;

function getFlashFillOperation(options?: {
    category?: OperationCategory;
    exampleTransformer?: (value: string) => any;
}) {
    return extendBaseOperation(FlashFillOperationBase, {
        config: {
            category: options?.category,
            exampleTransformer: options?.exampleTransformer
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
                 * from pyspark.sql import types as T
                 * from pyspark.sql import functions as F
                 * df = df.withColumn('Some_column_derived', F.lit(None).cast(T.StringType()))
                 * df = df.select(*(df.columns[:1] + 'Some_column_derived' + df.columns[1:]))
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.sql import types as T",
                        "from pyspark.sql import functions as F",
                        `${df} = ${df}.withColumn('${newName}', F.lit(None).cast(T.StringType()))`,
                        `${df} = ${df}.select(*(${df}.columns[:${insertIndex}] + '${newName}' + ${df}.columns[${insertIndex}:]))`
                    ].join("\n")
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
