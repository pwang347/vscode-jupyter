import { OperationKey } from "@dw/orchestrator";
import { ScaleOperationBase } from "../../../core/operations/scale";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.Scale]: extendBaseOperation(ScaleOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, newMinimum: min, newMaximum: max } = ctx.baseProgram;
            return {
                /**
                 * Example: scale values in the 'Survived' column between 0 and 10
                 * ```
                 * from pyspark.ml.feature import MinMaxScaler
                 * from pyspark.ml.linalg import VectorAssembler
                 *
                 * columns_to_scale = ['Survived']
                 * assemblers = [VectorAssembler(inputCols=[col], outputCol=col + '_vec') for col in columns_to_scale]
                 * scalers = [MinMaxScaler(min=0, max=10, inputCol=col + '_vec', outputCol=col + '_scaled') for col in columns_to_scale]
                 * pipeline = Pipeline(stages=assemblers + scalers)
                 * scalerModel = pipeline.fit(df)
                 * df = scalerModel.transform(df)
                 * ```
                 */
                getCode: () =>
                    [
                        "from pyspark.ml.feature import MinMaxScaler",
                        "from pyspark.ml.linalg import VectorAssembler",
                        "",
                        `columns_to_scale = [${columnKeys.join(", ")}]`,
                        "assemblers = [VectorAssembler(inputCols=[col], outputCol=col + '_vec') for col in columns_to_scale]",
                        `scalers = [MinMaxScaler(min=${min}, max=${max}, inputCol=col + '_vec', outputCol=col + '_scaled') for col in columns_to_scale]`,
                        "pipeline = Pipeline(stages=assemblers + scalers)",
                        `scalerModel = pipeline.fit(${df})`,
                        `${df} = scalerModel.transform(${df})`
                    ].join("\n")
            };
        }
    })
};
