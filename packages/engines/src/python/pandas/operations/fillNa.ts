import { OperationKey } from "@dw/orchestrator";
import { FillMethod, FillNaOperationBase } from "../../../core/operations/fillNa";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";

export default {
    [OperationKey.FillNa]: extendBaseOperation(FillNaOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName, columnKeys, fill, type } = ctx.baseProgram;
            const replacementValue =
                fill.parameter !== undefined ? toPythonValueString(fill.parameter, type) : undefined;

            let imports = "";
            if (replacementValue && replacementValue.isDateTime) {
                imports = "from datetime import datetime\n";
            }

            // mode() returns a pandas.Series
            const extractValue = fill.method === FillMethod.Mode ? "[0]" : "";
            const fillNaDict = columnKeys
                .map((key) =>
                    replacementValue
                        ? `${key}: ${replacementValue.value}`
                        : `${key}: ${variableName}[${key}].${fill.method}()${extractValue}`
                )
                .join(", ");

            return {
                /**
                 * Example of mean: replace missing values in the 'Survived' column with the mean value of the column.
                 * ```
                 * df = df.fillna({'Survived': df['Survived'].mean()})
                 * ```
                 *
                 * Example of median: replace missing values in the 'Survived' column with the median value of the column.
                 * ```
                 * df = df.fillna({'Survived': df['Survived'].median()})
                 * ```
                 *
                 * Example of mode: replace missing values in the 'Survived' column with the mode value of the column.
                 * ```
                 * df = df.fillna({'Survived': df['Survived'].mode()[0]})
                 * ```
                 *
                 * Example of bfill: fill gaps in 'Survived' column based on the next valid value after each gap.
                 * ```
                 * df = df.fillna({'Survived': df['Survived'].bfill()})
                 * ```
                 *
                 * Example of ffill: fill gaps in 'Survived' column based on the next valid value after each gap.
                 * ```
                 * df = df.fillna({'Survived': df['Survived'].ffill()})
                 * ```
                 *
                 * Example of custom: replace missing values in the 'Survived' column with custom value 3
                 * ```
                 * df = df.fillna({'Survived': 3})
                 * ```
                 */
                getCode: () => imports + `${variableName} = ${variableName}.fillna({${fillNaDict}})`
            };
        }
    })
};
