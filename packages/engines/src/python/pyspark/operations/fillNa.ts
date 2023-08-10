import { OperationKey } from "@dw/orchestrator";
import { FillMethod, FillNaOperationBase } from "../../../core/operations/fillNa";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";
import { TranslationValidationResultType } from "@dw/messaging";

export default {
    [OperationKey.FillNa]: extendBaseOperation(FillNaOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, fill, type } = ctx.baseProgram;

            if (fill.method === FillMethod.Bfill) {
                return {
                    getCode: () =>
                        [
                            "from pyspark.sql import functions as F",
                            "from pyspark.sql import Window",
                            "import uuid",
                            "import sys",
                            "temp_id = str(uuid.uuid4())",
                            `${df} = ${df}.withColumn(temp_id, F.monotonically_increasing_id())`,
                            "window = Window.orderBy(temp_id).rowsBetween(0, sys.maxsize)",
                            columnKeys
                                .map(
                                    (key) =>
                                        `${df} = ${df}.withColumn(${key}, F.first(${key}, ignorenulls=True).over(window))`
                                )
                                .join("\n"),
                            `df = df.drop(temp_id)`
                        ].join("\n")
                };
            }

            if (fill.method === FillMethod.Ffill) {
                return {
                    getCode: () =>
                        [
                            "from pyspark.sql import functions as F",
                            "from pyspark.sql import Window",
                            "import uuid",
                            "temp_id = str(uuid.uuid4())",
                            `${df} = ${df}.withColumn(temp_id, F.monotonically_increasing_id())`,
                            "window = Window.orderBy(temp_id)",
                            columnKeys
                                .map(
                                    (key) =>
                                        `${df} = ${df}.withColumn(${key}, F.last(${key}, ignorenulls=True).over(window))`
                                )
                                .join("\n"),
                            `df = df.drop(temp_id)`
                        ].join("\n")
                };
            }

            if (fill.method === FillMethod.Custom && fill.parameter !== undefined) {
                const replacementValue = toPythonValueString(fill.parameter, type);

                let imports = "";
                if (replacementValue && replacementValue.isDateTime) {
                    imports = "from datetime import datetime\n";
                }

                /**
                 * Example of custom: replace missing values in the 'Survived' column with custom value 3
                 * ```
                 * df = df.fillna(value=3, subset=['Survived'])
                 * ```
                 */
                return {
                    getCode: () =>
                        `${imports}${df} = ${df}.fillna(value=${replacementValue.value}, subset=[${columnKeys.join(
                            ", "
                        )}])`
                };
            }

            return {
                /**
                 * Example of mean: replace missing values in the 'Survived' column with the mean value of the column.
                 * Note that the strategy below could be set to 'mean', 'median' or 'mode'.
                 * ```
                 * from pyspark.ml.feature import Imputer
                 * cols = ['Survived']
                 * imputer = Imputer(inputCols=cols, outputCols=cols, strategy='mean')
                 * df = imputer.fit(df).transform(df)
                 * ```
                 */
                getCode: () =>
                    [
                        `from pyspark.ml.feature import Imputer`,
                        `cols = [${columnKeys.join(", ")}]`,
                        `imputer = Imputer(inputCols=cols, outputCols=cols, strategy='${fill.method}')`,
                        `${df} = imputer.fit(${df}).transform(${df})`
                    ].join("\n")
            };
        },
        validateBaseProgram: (ctx) => {
            const { baseProgram, getLocalizedStrings, formatString, originalEngineName } = ctx;
            const { fill } = baseProgram;
            if (fill.method === FillMethod.Bfill || fill.method === FillMethod.Ffill) {
                return {
                    type: TranslationValidationResultType.Warning,
                    id: "pyspark-forward-backward-fill-warning",
                    getMessage: (locale) =>
                        formatString(
                            getLocalizedStrings(locale).OperationCompatibilityPoorPerformanceWarning,
                            originalEngineName
                        )
                };
            }
            if (fill.method === FillMethod.Median) {
                return {
                    type: TranslationValidationResultType.Warning,
                    id: "pyspark-median-warning",
                    getMessage: (locale) => getLocalizedStrings(locale).OperationFillNaWarningPySparkMedian
                };
            }
            return {
                type: TranslationValidationResultType.Success
            };
        }
    })
};
