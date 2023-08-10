import { ColumnType } from "@dw/messaging";
import { FilterCondition, FilterOperationBase, JoinType } from "./filter";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = FilterOperationBase();

describe("[Base Program] Column operation: filter column", () => {
    it("should handle happy path for 1 column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {
                    AdditionalConditions: {
                        children: []
                    }
                },
                {
                    TypedCondition: {
                        Condition: {
                            value: FilterCondition.Equal,
                            subMenu: {
                                Value: "123"
                            }
                        }
                    }
                }
            ),
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.Equal,
                    conditionValue: "123",
                    matchCase: undefined
                },
                additionalConditions: []
            },
            "Filter rows based on column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 column with string type using nothas (not contains) condition matching case", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {
                    AdditionalConditions: {
                        children: []
                    }
                },
                {
                    TypedCondition: {
                        Condition: {
                            value: FilterCondition.NotHas,
                            subMenu: {
                                Value: "some_string",
                                MatchCase: true
                            }
                        }
                    }
                }
            ),
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.NotHas,
                    conditionValue: "some_string",
                    matchCase: true
                },
                additionalConditions: []
            },
            "Filter rows based on column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {
                    AdditionalConditions: {
                        children: [
                            {
                                Join: {
                                    value: JoinType.And
                                },
                                TargetColumns: {
                                    value: [
                                        {
                                            key: "'Another_column'",
                                            name: "Another_column",
                                            index: 2
                                        }
                                    ],
                                    subMenu: {
                                        TypedCondition: {
                                            Condition: {
                                                value: FilterCondition.StartsWith,
                                                subMenu: {
                                                    Value: "foo",
                                                    MatchCase: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    TypedCondition: {
                        Condition: {
                            value: FilterCondition.Equal,
                            subMenu: {
                                Value: "123"
                            }
                        }
                    }
                }
            ),
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.Equal,
                    conditionValue: "123",
                    matchCase: undefined
                },
                additionalConditions: [
                    {
                        joinType: JoinType.And,
                        columnKey: "'Another_column'",
                        type: ColumnType.String,
                        conditionType: FilterCondition.StartsWith,
                        conditionValue: "foo",
                        matchCase: true
                    }
                ]
            },
            "Filter rows based on columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when first condition target is not selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when nested condition target is not selected", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getOneColumnOperationContext(
                {
                    AdditionalConditions: {
                        children: [
                            {
                                Join: {
                                    value: JoinType.And
                                },
                                TargetColumns: {
                                    value: [
                                        {
                                            key: "'Another_column'",
                                            name: "Another_column",
                                            index: 2
                                        }
                                    ],
                                    subMenu: {
                                        TypedCondition: {
                                            Condition: {
                                                value: FilterCondition.StartsWith,
                                                subMenu: {
                                                    Value: "foo",
                                                    MatchCase: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                Join: {
                                    value: JoinType.And
                                },
                                TargetColumns: {
                                    value: [],
                                    subMenu: {
                                        TypedCondition: {
                                            Condition: {
                                                value: FilterCondition.StartsWith,
                                                subMenu: {
                                                    Value: "foo",
                                                    MatchCase: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    TypedCondition: {
                        Condition: {
                            value: FilterCondition.Equal,
                            subMenu: {
                                Value: "123"
                            }
                        }
                    }
                }
            )
        );
    });
});
