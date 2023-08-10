import { OperationKey } from "@dw/orchestrator";
import { AggregationType, GroupByAndAggregateOperationBase } from "../../../core/operations/groupByAndAggregate";
import { extendBaseOperation } from "../../../core/translate";

function getAggregationFunctionByType(key: AggregationType): string {
    switch (key) {
        case AggregationType.Count:
            return "'count'";
        case AggregationType.First:
            return "'first'";
        case AggregationType.Last:
            return "'last'";
        case AggregationType.CountDistinct:
            return "'nunique'";
        case AggregationType.Mode:
            // note that we can't use pd.Series.mode since that one can fail with certain data
            return "lambda s: s.value_counts().index[0]";
        case AggregationType.Min:
            return "'min'";
        case AggregationType.Max:
            return "'max'";
        case AggregationType.IndexMin:
            return "'idxmin'";
        case AggregationType.IndexMax:
            return "'idxmax'";
        case AggregationType.All:
            return "'all'";
        case AggregationType.Any:
            return "'any'";
        case AggregationType.Sum:
            return "'sum'";
        case AggregationType.Mean:
            return "'mean'";
        case AggregationType.StandardDeviation:
            return "'std'";
        case AggregationType.Variance:
            return "'var'";
        case AggregationType.StandardErrorOfTheMean:
            return "'sem'";
        case AggregationType.Skew:
            return "'skew'";
        case AggregationType.ProductOfAllValues:
            return "'prod'";
    }
}

export default {
    [OperationKey.GroupByAndAggregate]: extendBaseOperation(GroupByAndAggregateOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName, groupByKeys, aggregations } = ctx.baseProgram;
            return {
                /**
                 * Example: group by 'Age', 'Survived' columns and aggregate using 'Sum' on 'Survived'
                 * ```
                 * df = df.groupby(['Age', 'Survived']).agg(Survived_sum=('Survived', 'sum')).reset_index()
                 * ```
                 */
                getCode: () =>
                    `${variableName} = ${variableName}.groupby([${groupByKeys.join(", ")}]).agg(${aggregations
                        .map(
                            (agg) =>
                                `${agg.newColumnName}=(${agg.columnKey}, ${getAggregationFunctionByType(
                                    agg.aggregationType
                                )})`
                        )
                        .join(", ")}).reset_index()`
            };
        }
    })
};
