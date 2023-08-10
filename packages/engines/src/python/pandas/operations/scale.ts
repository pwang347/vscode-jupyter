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
                 * new_min, new_max = 0, 10
                 * old_min, old_max = df['Survived'].min(), df['Survived'].max()
                 * df['Survived'] = (df['Survived'] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min
                 * ```
                 */
                getCode: () =>
                    [
                        // MinMaxScaler code in pandas taken from https://stackoverflow.com/a/50028155
                        `new_min, new_max = ${min}, ${max}`,
                        ...columnKeys.map((key) => {
                            return [
                                `old_min, old_max = ${df}[${key}].min(), ${df}[${key}].max()`,
                                `${df}[${key}] = (${df}[${key}] - old_min) / (old_max - old_min) * (new_max - new_min) + new_min`
                            ].join("\n");
                        })
                    ].join("\n")
            };
        }
    })
};
