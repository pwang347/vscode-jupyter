import { AggregationType, GroupByAndAggregateOperationBase } from "./groupByAndAggregate";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = GroupByAndAggregateOperationBase();

describe("[Base Program] Column operation: Group by and aggregate", () => {
    it("should handle happy path for 1 selected column and 1 aggregation", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                Aggregations: {
                    children: [
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Some_column",
                                        key: "'Some_column'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    Aggregation: {
                                        AggregationType: {
                                            value: AggregationType.Min
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }),
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
            "Performed 1 aggregation grouped on column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column and 2 aggregations", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                Aggregations: {
                    children: [
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Some_column",
                                        key: "'Some_column'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    Aggregation: {
                                        AggregationType: {
                                            value: AggregationType.Min
                                        }
                                    }
                                }
                            }
                        },
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Some_column",
                                        key: "'Some_column'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    Aggregation: {
                                        AggregationType: {
                                            value: AggregationType.CountDistinct
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }),
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
            "Performed 2 aggregations grouped on column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns and 2 aggregations", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                Aggregations: {
                    children: [
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Some_column",
                                        key: "'Some_column'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    Aggregation: {
                                        AggregationType: {
                                            value: AggregationType.Min
                                        }
                                    }
                                }
                            }
                        },
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Some_column",
                                        key: "'Some_column'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    Aggregation: {
                                        AggregationType: {
                                            value: AggregationType.CountDistinct
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }),
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
            "Performed 2 aggregations grouped on columns: 'Some_column', 'Another_column'"
        );
    });

    it("should return null result when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
