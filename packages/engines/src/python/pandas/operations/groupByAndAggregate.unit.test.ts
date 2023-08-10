import { AggregationType } from "../../../core/operations/groupByAndAggregate";
import Operations from "./groupByAndAggregate";
import { assertOperationCode } from "./testUtil";

const operation = Operations.GroupByAndAggregate;

describe("[Pandas] Column operation: Group by and aggregate", () => {
    it("[aggregation=count] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Count,
                        newColumnName: "Some_column_count"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_count=('Some_column', 'count')).reset_index()"
            }
        );
    });

    it("[aggregation=first] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.First,
                        newColumnName: "Some_column_first"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_first=('Some_column', 'first')).reset_index()"
            }
        );
    });

    it("[aggregation=last] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Last,
                        newColumnName: "Some_column_last"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_last=('Some_column', 'last')).reset_index()"
            }
        );
    });

    it("[aggregation=nunique] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_nunique=('Some_column', 'nunique')).reset_index()"
            }
        );
    });

    it("[aggregation=mode] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Mode,
                        newColumnName: "Some_column_mode"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_mode=('Some_column', lambda s: s.value_counts().index[0])).reset_index()"
            }
        );
    });

    it("[aggregation=min] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_min=('Some_column', 'min')).reset_index()"
            }
        );
    });

    it("[aggregation=max] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Max,
                        newColumnName: "Some_column_max"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_max=('Some_column', 'max')).reset_index()"
            }
        );
    });

    it("[aggregation=idxmin] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMin,
                        newColumnName: "Some_column_idxmin"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_idxmin=('Some_column', 'idxmin')).reset_index()"
            }
        );
    });

    it("[aggregation=idxmax] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.IndexMax,
                        newColumnName: "Some_column_idxmax"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_idxmax=('Some_column', 'idxmax')).reset_index()"
            }
        );
    });

    it("[aggregation=all] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.All,
                        newColumnName: "Some_column_all"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_all=('Some_column', 'all')).reset_index()"
            }
        );
    });

    it("[aggregation=any] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Any,
                        newColumnName: "Some_column_any"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_any=('Some_column', 'any')).reset_index()"
            }
        );
    });

    it("[aggregation=sum] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Sum,
                        newColumnName: "Some_column_sum"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_sum=('Some_column', 'sum')).reset_index()"
            }
        );
    });

    it("[aggregation=mean] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Mean,
                        newColumnName: "Some_column_mean"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_mean=('Some_column', 'mean')).reset_index()"
            }
        );
    });

    it("[aggregation=std] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.StandardDeviation,
                        newColumnName: "Some_column_std"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_std=('Some_column', 'std')).reset_index()"
            }
        );
    });

    it("[aggregation=var] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Variance,
                        newColumnName: "Some_column_var"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_var=('Some_column', 'var')).reset_index()"
            }
        );
    });

    it("[aggregation=sem] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.StandardErrorOfTheMean,
                        newColumnName: "Some_column_sem"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_sem=('Some_column', 'sem')).reset_index()"
            }
        );
    });

    it("[aggregation=skew] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Skew,
                        newColumnName: "Some_column_skew"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_skew=('Some_column', 'skew')).reset_index()"
            }
        );
    });

    it("[aggregation=prod] should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.ProductOfAllValues,
                        newColumnName: "Some_column_prod"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_prod=('Some_column', 'prod')).reset_index()"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'\\'Some_column\\''"],
                aggregations: [
                    {
                        columnKey: "'\\'Some_column\\''",
                        columnName: "'Some_column'",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    }
                ]
            },
            {
                code: "df = df.groupby(['\\'Some_column\\'']).agg(Some_column_min=('\\'Some_column\\'', 'min')).reset_index()"
            }
        );
    });

    it("should handle happy path for 1 selected column and 2 aggregations", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column']).agg(Some_column_min=('Some_column', 'min'), Some_column_nunique=('Some_column', 'nunique')).reset_index()"
            }
        );
    });

    it("should handle happy path for 2 selected columns and 2 aggregations", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                groupByKeys: ["'Some_column'", "'Another_column'"],
                aggregations: [
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.Min,
                        newColumnName: "Some_column_min"
                    },
                    {
                        columnKey: "'Some_column'",
                        columnName: "Some_column",
                        aggregationType: AggregationType.CountDistinct,
                        newColumnName: "Some_column_nunique"
                    }
                ]
            },
            {
                code: "df = df.groupby(['Some_column', 'Another_column']).agg(Some_column_min=('Some_column', 'min'), Some_column_nunique=('Some_column', 'nunique')).reset_index()"
            }
        );
    });
});
