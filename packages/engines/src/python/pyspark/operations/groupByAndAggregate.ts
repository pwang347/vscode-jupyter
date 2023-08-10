import { OperationKey } from "@dw/orchestrator";
import { AggregationType, GroupByAndAggregateOperationBase } from "../../../core/operations/groupByAndAggregate";
import { extendBaseOperation } from "../../../core/translate";
import { TranslationValidationResultType } from "@dw/messaging";
import { escapeSingleQuote } from "../../../core/operations/util";

function getAggregationFunctionByType(key: AggregationType, columnKey: string): string {
    switch (key) {
        case AggregationType.Count:
            return `F.count(${columnKey})`;
        case AggregationType.First:
            return `F.first(${columnKey})`;
        case AggregationType.Last:
            return `F.last(${columnKey})`;
        case AggregationType.CountDistinct:
            return `F.countDistinct(${columnKey})`;
        // note: nothing to return for mode as it gets filtered out
        case AggregationType.Mode:
            return "";
        case AggregationType.Min:
            return `F.min(${columnKey})`;
        case AggregationType.Max:
            return `F.max(${columnKey})`;
        // note: additional processing occurs for IndexMin and IndexMax afterwards
        case AggregationType.IndexMin:
            return `F.min(${columnKey})`;
        case AggregationType.IndexMax:
            return `F.max(${columnKey})`;
        case AggregationType.All:
            return `F.min(${columnKey})`;
        case AggregationType.Any:
            return `F.max(${columnKey})`;
        case AggregationType.Sum:
            return `F.sum(${columnKey})`;
        case AggregationType.Mean:
            return `F.avg(${columnKey})`;
        case AggregationType.StandardDeviation:
            return `F.stddev(${columnKey})`;
        case AggregationType.StandardErrorOfTheMean:
            return `(F.stddev(${columnKey}) / F.sqrt(F.count(${columnKey})))`;
        case AggregationType.Variance:
            return `F.variance(${columnKey})`;
        case AggregationType.Skew:
            // TODO@DW: this is a biased skew which produces slightly different results from the Pandas one (unbiased).
            // See https://stackoverflow.com/a/62099130
            return `F.skewness(${columnKey})`;
        case AggregationType.ProductOfAllValues:
            return `F.product(${columnKey})`;
    }
}

export default {
    [OperationKey.GroupByAndAggregate]: extendBaseOperation(GroupByAndAggregateOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, groupByKeys, aggregations } = ctx.baseProgram;
            let hasModeOps = false;
            let hasIndexOps = false;
            const modeAggregations: typeof aggregations = [];
            const indexOpAggregations: typeof aggregations = [];
            const resultColumns: string[] = groupByKeys.map((key) => key);
            const aggregationsBaseString = aggregations
                .map((agg) => {
                    let newName = `'${agg.newColumnName}'`;
                    resultColumns.push(newName);

                    if (agg.aggregationType === AggregationType.Mode) {
                        hasModeOps = true;
                        modeAggregations.push(agg);
                        return undefined;
                    }
                    if (
                        agg.aggregationType === AggregationType.IndexMin ||
                        agg.aggregationType === AggregationType.IndexMax
                    ) {
                        hasIndexOps = true;
                        const tempAggType =
                            agg.aggregationType === AggregationType.IndexMin
                                ? AggregationType.Min
                                : AggregationType.Max;
                        newName = `'${escapeSingleQuote(agg.columnName) + "_" + tempAggType}Temp'`;
                        indexOpAggregations.push(agg);
                    }
                    return `${getAggregationFunctionByType(agg.aggregationType, agg.columnKey)}.alias(${newName})`;
                })
                .filter((text) => text !== undefined)
                .join(", ");

            const groupByKeysSet = new Set(groupByKeys);
            const groupByKeysAccessor: string = groupByKeys.join(", ");
            const imports: Set<string> = new Set(["from pyspark.sql import functions as F"]);

            // code before group by
            let preamble: string[] = [];

            // group by code
            let groupByExpression = `${df} = ${df}.groupBy(${groupByKeysAccessor}).agg(${aggregationsBaseString})`;

            // code after group by
            let postamble: string[] = [];

            // handle mode operation
            if (hasModeOps) {
                imports.add("from pyspark.sql import Window");
                imports.add("import uuid");
                preamble = preamble.concat([
                    "temp_count_col = str(uuid.uuid4())",
                    "temp_row_col = str(uuid.uuid4())",
                    `window = Window.partitionBy(${groupByKeysAccessor}).orderBy(F.col(temp_count_col).desc())`
                ]);

                if (aggregations.length === 1) {
                    // no group by expression if we only have a single aggregation
                    groupByExpression = "";
                } else if (aggregations.length === modeAggregations.length) {
                    // if all aggregations are mode, then we should use count() minimally to ensure we have a data frame
                    groupByExpression = `${df} = ${df}.groupBy(${groupByKeysAccessor}).count()`;
                }

                modeAggregations.map((agg, idx) => {
                    const suffix = idx > 0 ? `${idx}` : "";
                    const tempDfName = aggregations.length > 1 ? `${df}_mode${suffix}` : df;
                    const group = groupByKeysSet.has(agg.columnKey)
                        ? groupByKeysAccessor
                        : groupByKeysAccessor + ", " + agg.columnKey;
                    preamble = preamble.concat(
                        [
                            `${tempDfName} = ${df}.groupBy(${group}).agg(F.count(${agg.columnKey}).alias(temp_count_col))`,
                            `${tempDfName} = ${tempDfName}.withColumn(temp_row_col, F.row_number().over(window)).where(F.col(temp_row_col) == 1)`,
                            `${tempDfName} = ${tempDfName}.select(${group})`,
                            `${tempDfName} = ${tempDfName}.withColumnRenamed(${agg.columnKey}, '${agg.newColumnName}')`
                        ].join("\n")
                    );

                    if (aggregations.length > 1) {
                        postamble = postamble.concat([
                            `${df} = ${df}.join(${tempDfName}, [${groupByKeysAccessor}], 'left')`
                        ]);
                    }
                });
            }

            // handle index operations
            if (hasIndexOps) {
                imports.add("from pyspark.sql import Window");
                imports.add("import uuid");
                preamble = preamble.concat([
                    "temp_id = str(uuid.uuid4())",
                    `${df}_indexed = ${df}.withColumn(temp_id, F.row_number().over(Window.orderBy(F.lit(1))) - 1)`
                ]);
                postamble = postamble.concat(
                    indexOpAggregations.map((agg) => {
                        const newColName = `'${agg.newColumnName}'`;
                        const tempAggType =
                            agg.aggregationType === AggregationType.IndexMin
                                ? AggregationType.Min
                                : AggregationType.Max;
                        const tempColName = `'${escapeSingleQuote(agg.columnName) + "_" + tempAggType}Temp'`;
                        const groupedByKey = groupByKeysSet.has(agg.columnKey);
                        const dropColumnKey = groupedByKey ? "" : `.drop(${agg.columnKey})`;
                        return [
                            `${df} = ${df}.join(${df}_indexed.select(${agg.columnKey}, temp_id, ${groupByKeysAccessor}).withColumn(${tempColName}, ${df}_indexed[${agg.columnKey}]), [${tempColName}, ${groupByKeysAccessor}], 'left')`,
                            `${df} = ${df}.withColumnRenamed(temp_id, ${newColName}).drop(${tempColName})${dropColumnKey}`,
                            `${df} = ${df}.sort(${df}[${newColName}].asc())`,
                            `${df} = ${df}.dropDuplicates(subset=[${groupByKeysAccessor}])`
                        ].join("\n");
                    })
                );
            }

            if (hasIndexOps || (hasModeOps && aggregations.length > 1)) {
                // if we had either index or mode operations, we need to restore the correct
                // result order at the end
                postamble = postamble.concat([`${df} = ${df}.select(${resultColumns.join(",")})`]);
            }

            const sortedImports = Array.from(imports).sort((a, b) => a.localeCompare(b));
            return {
                /**
                 * Example: group by 'Age', 'Survived' columns and aggregate using 'Sum' on 'Survived'
                 * ```
                 * from pyspark.sql import functions as F
                 * df = df.groupBy('Age', 'Survived').agg(F.sum('Survived').alias('Survived_sum'))
                 * df = df.dropna()
                 * df = df.sort(df['Age'].asc(), df['Survived'].asc())
                 * ```
                 */
                getCode: () =>
                    [
                        sortedImports.join("\n"),
                        preamble.join("\n"),
                        groupByExpression,
                        postamble.join("\n"),
                        `${df} = ${df}.dropna()`,
                        `${df} = ${df}.sort(${groupByKeys.map((key) => `${df}[${key}].asc()`).join(", ")})`
                    ]
                        // ignore empty lines
                        .filter((expr) => !!expr)
                        .join("\n")
            };
        },
        validateBaseProgram: (ctx) => {
            const { baseProgram, getLocalizedStrings, formatString, originalEngineName } = ctx;
            const warnings = [];
            if (baseProgram.aggregations.find((agg) => agg.aggregationType === AggregationType.Skew)) {
                warnings.push({
                    id: "pyspark-aggregate-skew",
                    getMessage: (locale: string) =>
                        getLocalizedStrings(locale).OperationGroupByAndAggregateWarningPySparkSkewBiased
                });
            }
            if (
                baseProgram.aggregations.find(
                    (agg) =>
                        agg.aggregationType === AggregationType.IndexMax ||
                        agg.aggregationType === AggregationType.IndexMin ||
                        agg.aggregationType === AggregationType.Mode
                )
            ) {
                warnings.push({
                    id: "pyspark-no-indexmin-or-indexmax-or-mode",
                    getMessage: (locale: string) =>
                        formatString(
                            getLocalizedStrings(locale).OperationCompatibilityPoorPerformanceWarning,
                            originalEngineName
                        )
                });
            }
            if (warnings.length > 0) {
                return {
                    type: TranslationValidationResultType.MultiWarning,
                    warnings
                };
            }
            return {
                type: TranslationValidationResultType.Success
            };
        }
    })
};
