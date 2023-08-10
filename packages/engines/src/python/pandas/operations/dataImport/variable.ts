import { DataImportOperationKey } from "@dw/messaging";
import { VariableImportOperationBase } from "../../../../core/operations/dataImport/variable";
import { extendBaseDataImportOperation } from "../../../../core/translate";
import { DataFrameTypeIdentifier, PySparkDataFrameConversionMethod } from "@dw/orchestrator";

export default {
    [DataImportOperationKey.Variable]: extendBaseDataImportOperation(VariableImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const {
                variableName: df,
                convertedVariableName,
                dataFrameType,
                truncationRows,
                truncationFraction,
                conversionMethod,
                seed
            } = ctx.baseProgram;

            // handle PySpark data frames
            switch (dataFrameType) {
                case DataFrameTypeIdentifier.PySpark: {
                    const convertPySparkToPandasCode = generatePandasDataFrameFromPyspark(
                        df,
                        convertedVariableName!,
                        truncationRows,
                        truncationFraction,
                        conversionMethod,
                        seed
                    );
                    const checkTruncated = (
                        convertedVariableName: string,
                        truncationRows: number | undefined,
                        truncationFraction: number | undefined
                    ) => {
                        // If truncationFraction < 1, the dataframe must be truncated.
                        if (truncationFraction) {
                            return (
                                "\n" + [`if ${truncationFraction} < 1:`, `    print('{"truncated": true}')`].join("\n")
                            );
                        }
                        // If truncationRows == len(convertedVariableName), the dataframe may be truncated.
                        // TODO: Note that here the len() will return a value less than or equal to ${truncationRows}. If a spark dataframe has exactly ${truncationRows} rows, we cannot know for sure if it was truncated.
                        if (truncationRows) {
                            return (
                                "\n" +
                                [
                                    `if len(${convertedVariableName}) == ${truncationRows}:`,
                                    `    print('{"truncated": true}')`
                                ].join("\n")
                            );
                        }
                        return "";
                    };

                    return {
                        getRuntimeCode: () => {
                            return (
                                convertPySparkToPandasCode +
                                checkTruncated(convertedVariableName!, truncationRows, truncationFraction)
                            );
                        },
                        getDisplayCode: () => convertPySparkToPandasCode
                    };
                }
                case DataFrameTypeIdentifier.Pandas: // handle Pandas data frames
                    return {
                        getRuntimeCode: () =>
                            truncationRows
                                ? [
                                      `if len(${df}) > ${truncationRows}:`,
                                      `    ${df} = ${df}.head(${truncationRows})`,
                                      `    print('{"truncated": true}')`
                                  ].join("\n")
                                : "",
                        getDisplayCode: () => ""
                    };
            }
        }
    })
};

/**
 * Sample and convert a spark dataframe to a pandas dataframe for data wrangler.
 */
function generatePandasDataFrameFromPyspark(
    varName: string,
    convertedVarName: string,
    truncationRows?: number,
    truncationFraction?: number,
    conversionMethod?: PySparkDataFrameConversionMethod,
    seed?: number
) {
    if (!conversionMethod) {
        conversionMethod = PySparkDataFrameConversionMethod.LimitAndConvert; // The conversionMethod may be undefined due to an illegal url param so we set default conversion method here.
    }
    // Some conversion method must have truncation rows. If not set, use the full table conversion methods instead.
    // TODO: Maybe we need to add alerts here
    if (!truncationRows) {
        if (conversionMethod == PySparkDataFrameConversionMethod.RandomLimitAndConvertByCount) {
            conversionMethod = PySparkDataFrameConversionMethod.LimitAndConvert;
        }
        if (conversionMethod == PySparkDataFrameConversionMethod.RandomTakeAndConstructByCount) {
            conversionMethod = PySparkDataFrameConversionMethod.TakeAndConstruct;
        }
    }

    if (truncationFraction != null && (truncationFraction < 0 || truncationFraction > 1)) {
        throw new Error("Truncation fraction must be on interval [0, 1].");
    }

    const fractionParam = `fraction=float(${truncationFraction ?? 1})`;
    const seedParam = `${seed != null ? `, seed=${seed}` : ""}`;
    const columnsParam = `, columns=${varName}.columns`;

    let pandasConvertCode: string;
    switch (conversionMethod) {
        case PySparkDataFrameConversionMethod.LimitAndConvert:
            pandasConvertCode = `${convertedVarName} = ${varName}${
                truncationRows ? `.limit(${truncationRows})` : ""
            }.toPandas()`;
            break;
        case PySparkDataFrameConversionMethod.TakeAndConstruct:
            pandasConvertCode = `import pandas as pd\n${convertedVarName} = pd.DataFrame(${varName}${
                truncationRows ? `.take(${truncationRows})` : `.collect()`
            }${columnsParam})`;
            break;
        case PySparkDataFrameConversionMethod.RandomTakeAndConstructByFraction:
            pandasConvertCode = `import pandas as pd\n${convertedVarName} = pd.DataFrame(${varName}.sample(${fractionParam}${seedParam})${
                truncationRows ? `.take(${truncationRows})` : `.collect()`
            }${columnsParam})`;
            break;
        case PySparkDataFrameConversionMethod.RandomLimitAndConvertByFraction:
            pandasConvertCode = `${convertedVarName} = ${varName}.sample(${fractionParam}${seedParam})${
                truncationRows ? `.limit(${truncationRows})` : ""
            }.toPandas()`;
            break;
        case PySparkDataFrameConversionMethod.RandomLimitAndConvertByCount:
            pandasConvertCode = `${convertedVarName} = ${varName}.sample(1.0*${truncationRows}/${varName}.count()${seedParam}).limit(${truncationRows}).toPandas()`;
            break;
        case PySparkDataFrameConversionMethod.RandomTakeAndConstructByCount:
            pandasConvertCode = `import pandas as pd\n${convertedVarName} = pd.DataFrame(${varName}.sample(1.0*${truncationRows}/${varName}.count()${seedParam}).take(${truncationRows})${columnsParam})`;
            break;
        case PySparkDataFrameConversionMethod.RDDTakeSampleAndConstruct:
            pandasConvertCode = `import pandas as pd\n${convertedVarName} = pd.DataFrame(${varName}.rdd.takeSample(num=${
                truncationRows ? `${truncationRows}` : `${varName}.count()`
            }, withReplacement=False${seedParam})${columnsParam})`;
            break;
        case PySparkDataFrameConversionMethod.TailAndConstruct:
            pandasConvertCode = `import pandas as pd\n${convertedVarName} = pd.DataFrame(${varName}${
                truncationRows ? `.tail(${truncationRows})` : ".collect()"
            }${columnsParam})`;
            break;
        default:
            throw Error("Unknown conversion method.");
    }
    return pandasConvertCode;
}
