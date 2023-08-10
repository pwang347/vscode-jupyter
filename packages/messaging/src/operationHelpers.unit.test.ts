import {
    FailedFilterCode,
    filterColumn,
    getDefaultArgs,
    getSelectionType,
    getTargetableColumnNames,
    getTargetableColumns,
    getUniqueColumnName
} from "./operationHelpers";
import * as assert from "assert";
import { IDataFrameHeader, PreviewAnnotationType } from "./dataframe";
import { ColumnType } from "./datatypes";
import { ArgType, createArg, IColumnTarget } from "./operations";

const mockDataFrame: IDataFrameHeader = {
    columns: [
        {
            name: "Index",
            key: "'Index'",
            index: 0,
            type: ColumnType.Integer,
            rawType: "int64"
        },
        {
            name: "A",
            key: "'A'",
            index: 1,
            type: ColumnType.Boolean,
            rawType: "bool",
            annotations: {
                annotationType: PreviewAnnotationType.Added
            }
        },
        {
            name: "B",
            key: "'B'",
            index: 2,
            type: ColumnType.String,
            rawType: "object"
        },
        {
            name: "C",
            key: "'C'",
            index: 3,
            type: ColumnType.Boolean,
            rawType: "bool"
        },
        {
            name: "D",
            key: "'D'",
            index: 4,
            type: ColumnType.Integer,
            rawType: "int64",
            isMixed: true
        },
        {
            name: "E",
            key: "'E'",
            index: 5,
            type: ColumnType.Unknown,
            rawType: "interval"
        }
    ] as Array<any>,
    variableName: "",
    shape: {
        rows: 0,
        columns: 0
    },
    historyItem: {} as any,
    indexColumnKey: ""
};

describe("Args helpers tests", () => {
    describe("getSelectionType", () => {
        it("should return null for no selection", () => {
            assert.strictEqual(getSelectionType([]), null);
        });

        it("should return type of selection if only one column", () => {
            assert.strictEqual(getSelectionType([mockDataFrame.columns[1]]), ColumnType.Boolean);
        });

        it("should return null if multiple selected and mismatched", () => {
            assert.strictEqual(getSelectionType([mockDataFrame.columns[1], mockDataFrame.columns[2]]), null);
        });

        it("should return type of selection if all are the same", () => {
            assert.strictEqual(
                getSelectionType([mockDataFrame.columns[1], mockDataFrame.columns[3]]),
                ColumnType.Boolean
            );
        });
    });

    describe("filterColumn", () => {
        it("should succeed for standard columns by default", () => {
            assert.strictEqual(filterColumn(mockDataFrame.columns[0], []), undefined);
        });

        it("should fail for mixed columns by default", () => {
            assert.strictEqual(filterColumn(mockDataFrame.columns[4], []), FailedFilterCode.MixedColumn);
        });

        it("should succeed for mixed columns with an allow filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[4], [], {
                    allowMixedType: true
                }),
                undefined
            );
        });

        it("should fail for unknown columns by default", () => {
            assert.strictEqual(filterColumn(mockDataFrame.columns[5], []), FailedFilterCode.UnknownType);
        });

        it("should succeed for unknown columns with an allow filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[5], [], {
                    allowUnknownType: true
                }),
                undefined
            );
        });

        it("should fail when type doesn't match filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[2], [], {
                    allowedTypes: [ColumnType.Boolean]
                }),
                FailedFilterCode.TypeMismatch
            );
        });

        it("should succeed when type matches filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[1], [], {
                    allowedTypes: [ColumnType.Boolean]
                }),
                undefined
            );
        });

        it("should fail when raw type doesn't match filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[2], [], {
                    allowedRawTypes: ["bool"]
                }),
                FailedFilterCode.RawTypeMismatch
            );
        });

        it("should succeed when raw type matches filter", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[1], [], {
                    allowedRawTypes: ["bool"]
                }),
                undefined
            );
        });

        it("should succeed when no selection and requires same type", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[2], [], {
                    requiresSameType: true
                }),
                undefined
            );
        });

        it("should fail when types are different and requires same type", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[2], [mockDataFrame.columns[1]], {
                    requiresSameType: true
                }),
                FailedFilterCode.TypesNotSame
            );
        });

        it("should succeed when all types are same and requires same type", () => {
            assert.strictEqual(
                filterColumn(mockDataFrame.columns[1], [mockDataFrame.columns[3]], {
                    requiresSameType: true
                }),
                undefined
            );
        });
    });

    describe("getDefaultArgs", () => {
        describe("Target", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(getDefaultArgs(mockDataFrame, [createArg("TargetArg", ArgType.Target)], []), {
                    TargetArg: { value: [], subMenu: {} }
                });
                // ignore index columns, preview columns, mixed, unknown types
                const allValidColumns: IColumnTarget[] = [mockDataFrame.columns[2], mockDataFrame.columns[3]];
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [createArg("TargetArg", ArgType.Target, { selectAllByDefault: true })],
                        []
                    ),
                    {
                        TargetArg: { value: allValidColumns, subMenu: {} }
                    }
                );
            });

            it("should handle default case with submenus", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TargetArg", ArgType.Target, {
                                subMenu: [
                                    createArg("SubArg", ArgType.Boolean, {
                                        default: true
                                    })
                                ]
                            })
                        ],
                        []
                    ),
                    {
                        TargetArg: {
                            value: [],
                            subMenu: {
                                SubArg: true
                            }
                        }
                    }
                );
            });

            it("should keep any valid targets in current selection", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TargetArg", ArgType.Target, {
                                subMenu: [
                                    createArg("SubArg", ArgType.Boolean, {
                                        default: true
                                    })
                                ],
                                targetFilter: {
                                    allowedTypes: [ColumnType.Boolean]
                                }
                            })
                        ],
                        [
                            mockDataFrame.columns[1], // preview, so bad
                            mockDataFrame.columns[2], // not a boolean type
                            mockDataFrame.columns[3]
                        ]
                    ),
                    {
                        TargetArg: {
                            value: [mockDataFrame.columns[3]],
                            subMenu: {
                                SubArg: true
                            }
                        }
                    }
                );
            });

            it("should keep all columns with first valid type", () => {
                const df = {
                    ...mockDataFrame,
                    columns: mockDataFrame.columns.concat([
                        {
                            name: "F",
                            key: "'F'",
                            index: 6,
                            type: ColumnType.String,
                            rawType: "object"
                        } as any
                    ])
                };
                assert.deepStrictEqual(
                    getDefaultArgs(
                        df,
                        [
                            createArg("TargetArg", ArgType.Target, {
                                subMenu: [
                                    createArg("SubArg", ArgType.Boolean, {
                                        default: true
                                    })
                                ],
                                targetFilter: {
                                    requiresSameType: true
                                }
                            })
                        ],
                        [
                            df.columns[1], // preview, so bad
                            df.columns[2],
                            df.columns[3], // ignored since not same type
                            df.columns[4], // ignored since not same type
                            df.columns[5], // ignored unknown type
                            df.columns[6]
                        ]
                    ),
                    {
                        TargetArg: {
                            value: [df.columns[2], df.columns[6]],
                            subMenu: {
                                SubArg: true
                            }
                        }
                    }
                );
            });

            it("should take the first target only if single select", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TargetArg", ArgType.Target, {
                                subMenu: [
                                    createArg("SubArg", ArgType.Boolean, {
                                        default: true
                                    })
                                ],
                                targetFilter: {
                                    isSingleTarget: true
                                }
                            })
                        ],
                        [
                            mockDataFrame.columns[1], // preview, so bad
                            mockDataFrame.columns[2],
                            mockDataFrame.columns[3] // ignored since not first target
                        ]
                    ),
                    {
                        TargetArg: {
                            value: [mockDataFrame.columns[2]],
                            subMenu: {
                                SubArg: true
                            }
                        }
                    }
                );
            });
        });

        describe("ArgGroup", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(mockDataFrame, [createArg("ArgGroupArg", ArgType.ArgGroup)], []),
                    {
                        ArgGroupArg: { children: [] }
                    }
                );
            });

            it("should allow targets to be sequentially added", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("ArgGroupArg", ArgType.ArgGroup, {
                                args: [createArg("Target", ArgType.Target)],
                                addGroupLabel: "Add",
                                sequentiallyFillTargets: true,
                                sequentiallyFillTargetsOffset: 1
                            })
                        ],
                        [
                            mockDataFrame.columns[1], // preview, so bad
                            mockDataFrame.columns[2], // skipped by sequential fill offset
                            mockDataFrame.columns[3]
                        ]
                    ),
                    {
                        ArgGroupArg: {
                            children: [
                                {
                                    Target: {
                                        value: [mockDataFrame.columns[3]],
                                        subMenu: {}
                                    }
                                }
                            ]
                        }
                    }
                );
            });
        });

        describe("VariableColumnType", () => {
            it("should default to specified type", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [createArg("VariableColumnTypeArg", ArgType.VariableColumnType)],
                        [mockDataFrame.columns[1]]
                    ),
                    {
                        VariableColumnTypeArg: false
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("VariableColumnTypeArg", ArgType.VariableColumnType, {
                                [ArgType.Boolean]: {
                                    default: true
                                }
                            })
                        ],
                        [mockDataFrame.columns[1]]
                    ),
                    {
                        VariableColumnTypeArg: true
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [createArg("VariableColumnTypeArg", ArgType.VariableColumnType)],
                        [mockDataFrame.columns[2]]
                    ),
                    {
                        VariableColumnTypeArg: ""
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("VariableColumnTypeArg", ArgType.VariableColumnType, {
                                [ArgType.String]: {
                                    default: "foo"
                                }
                            })
                        ],
                        [mockDataFrame.columns[2]]
                    ),
                    {
                        VariableColumnTypeArg: "foo"
                    }
                );
            });

            it("should return null if invalid", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(mockDataFrame, [createArg("VariableColumnTypeArg", ArgType.VariableColumnType)], []),
                    {
                        VariableColumnTypeArg: null
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [createArg("VariableColumnTypeArg", ArgType.VariableColumnType)],
                        [mockDataFrame.columns[2], mockDataFrame.columns[3]]
                    ),
                    {
                        VariableColumnTypeArg: null
                    }
                );
            });

            it("should also work with multiple columns as long as they are the same", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [createArg("VariableColumnTypeArg", ArgType.VariableColumnType)],
                        [mockDataFrame.columns[1], mockDataFrame.columns[3]]
                    ),
                    {
                        VariableColumnTypeArg: false
                    }
                );
            });
        });

        describe("TypeDependent", () => {
            it("should return the option corresponding to the current type", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TypeDependentArg", ArgType.TypeDependent, {
                                [ColumnType.Boolean]: [createArg("NestedArg", ArgType.Boolean)],
                                [ColumnType.Category]: [],
                                [ColumnType.Complex]: [],
                                [ColumnType.Datetime]: [],
                                [ColumnType.Float]: [],
                                [ColumnType.Integer]: [],
                                [ColumnType.Interval]: [],
                                [ColumnType.Period]: [],
                                [ColumnType.String]: [],
                                [ColumnType.Timedelta]: [],
                                [ColumnType.Unknown]: []
                            })
                        ],
                        [mockDataFrame.columns[1]]
                    ),
                    {
                        TypeDependentArg: {
                            NestedArg: false
                        }
                    }
                );
            });

            it("should return the option corresponding to the current type multiple", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TypeDependentArg", ArgType.TypeDependent, {
                                [ColumnType.Boolean]: [
                                    createArg("NestedArg", ArgType.Boolean),
                                    createArg("SecondNestedArg", ArgType.String)
                                ],
                                [ColumnType.Category]: [],
                                [ColumnType.Complex]: [],
                                [ColumnType.Datetime]: [],
                                [ColumnType.Float]: [],
                                [ColumnType.Integer]: [],
                                [ColumnType.Interval]: [],
                                [ColumnType.Period]: [],
                                [ColumnType.String]: [],
                                [ColumnType.Timedelta]: [],
                                [ColumnType.Unknown]: []
                            })
                        ],
                        [mockDataFrame.columns[1]]
                    ),
                    {
                        TypeDependentArg: {
                            NestedArg: false,
                            SecondNestedArg: ""
                        }
                    }
                );
            });

            it("should return an empty object if no args provided", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TypeDependentArg", ArgType.TypeDependent, {
                                [ColumnType.Boolean]: [],
                                [ColumnType.Category]: [],
                                [ColumnType.Complex]: [],
                                [ColumnType.Datetime]: [],
                                [ColumnType.Float]: [],
                                [ColumnType.Integer]: [],
                                [ColumnType.Interval]: [],
                                [ColumnType.Period]: [],
                                [ColumnType.String]: [],
                                [ColumnType.Timedelta]: [],
                                [ColumnType.Unknown]: []
                            })
                        ],
                        [mockDataFrame.columns[1]]
                    ),
                    {
                        TypeDependentArg: {}
                    }
                );
            });

            it("should return the option corresponding to the current type with multiple columns as long as they are the same", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("TypeDependentArg", ArgType.TypeDependent, {
                                [ColumnType.Boolean]: [createArg("NestedArg", ArgType.Boolean)],
                                [ColumnType.Category]: [],
                                [ColumnType.Complex]: [],
                                [ColumnType.Datetime]: [],
                                [ColumnType.Float]: [],
                                [ColumnType.Integer]: [],
                                [ColumnType.Interval]: [],
                                [ColumnType.Period]: [],
                                [ColumnType.String]: [],
                                [ColumnType.Timedelta]: [],
                                [ColumnType.Unknown]: []
                            })
                        ],
                        [mockDataFrame.columns[1], mockDataFrame.columns[3]]
                    ),
                    {
                        TypeDependentArg: {
                            NestedArg: false
                        }
                    }
                );
            });
        });

        describe("Boolean", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(getDefaultArgs(mockDataFrame, [createArg("BooleanArg", ArgType.Boolean)], []), {
                    BooleanArg: false
                });
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("BooleanArg", ArgType.Boolean, {
                                default: true
                            })
                        ],
                        []
                    ),
                    {
                        BooleanArg: true
                    }
                );
            });
        });

        describe("Integer", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(getDefaultArgs(mockDataFrame, [createArg("IntegerArg", ArgType.Integer)], []), {
                    IntegerArg: 0
                });
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("IntegerArg", ArgType.Integer, {
                                default: 5
                            })
                        ],
                        []
                    ),
                    {
                        IntegerArg: 5
                    }
                );
            });
        });

        describe("Float", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(getDefaultArgs(mockDataFrame, [createArg("FloatArg", ArgType.Float)], []), {
                    FloatArg: 0
                });
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("FloatArg", ArgType.Float, {
                                default: 5.5
                            })
                        ],
                        []
                    ),
                    {
                        FloatArg: 5.5
                    }
                );
            });
        });

        describe("Category", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("CategoryArg", ArgType.Category, {
                                choices: [
                                    {
                                        key: "foo",
                                        label: "foo"
                                    },
                                    {
                                        key: "bar",
                                        label: "bar"
                                    }
                                ]
                            })
                        ],
                        []
                    ),
                    {
                        CategoryArg: { value: "foo", subMenu: {} }
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("CategoryArg", ArgType.Category, {
                                choices: [
                                    {
                                        key: "foo",
                                        label: "fooLabel"
                                    },
                                    {
                                        key: "bar",
                                        label: "barLabel"
                                    }
                                ],
                                default: "bar"
                            })
                        ],
                        []
                    ),
                    {
                        CategoryArg: { value: "bar", subMenu: {} }
                    }
                );
            });

            it("should handle submenu case", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("CategoryArg", ArgType.Category, {
                                choices: [
                                    {
                                        key: "foo",
                                        label: "foo"
                                    },
                                    {
                                        key: "bar",
                                        label: "bar"
                                    }
                                ],
                                subMenuByChoice: {
                                    foo: [createArg("FooArg", ArgType.String, { default: "foo" })],
                                    bar: [createArg("BarArg", ArgType.Boolean, { default: true })]
                                }
                            })
                        ],
                        []
                    ),
                    {
                        CategoryArg: {
                            value: "foo",
                            subMenu: {
                                FooArg: "foo"
                            }
                        }
                    }
                );
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("CategoryArg", ArgType.Category, {
                                choices: [
                                    {
                                        key: "foo",
                                        label: "foo"
                                    },
                                    {
                                        key: "bar",
                                        label: "bar"
                                    }
                                ],
                                default: "bar",
                                subMenuByChoice: {
                                    foo: [createArg("FooArg", ArgType.String, { default: "foo" })],
                                    bar: [createArg("BarArg", ArgType.Boolean, { default: true })]
                                }
                            })
                        ],
                        []
                    ),
                    {
                        CategoryArg: {
                            value: "bar",
                            subMenu: {
                                BarArg: true
                            }
                        }
                    }
                );
            });
        });

        describe("String", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(getDefaultArgs(mockDataFrame, [createArg("StringArg", ArgType.String)], []), {
                    StringArg: ""
                });
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("StringArg", ArgType.String, {
                                default: "foo"
                            })
                        ],
                        []
                    ),
                    {
                        StringArg: "foo"
                    }
                );
            });

            it("should handle unique name case", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(
                        mockDataFrame,
                        [
                            createArg("StringArg", ArgType.String, {
                                default: "A",
                                isUniqueColumnName: true
                            })
                        ],
                        []
                    ),
                    {
                        StringArg: "A_1"
                    }
                );
            });
        });

        describe("Timedelta", () => {
            it("should handle default case", () => {
                assert.deepStrictEqual(
                    getDefaultArgs(mockDataFrame, [createArg("TimedeltaArg", ArgType.Timedelta)], []),
                    {
                        TimedeltaArg: "P0DT0H0M0S"
                    }
                );
            });
        });
    });

    describe("getUniqueColumnName", () => {
        it("should return incomplete if unnecessary", () => {
            assert.strictEqual(getUniqueColumnName("foo", ["bar", "baz"]), "foo");
        });

        it("should create unique names", () => {
            assert.strictEqual(getUniqueColumnName("foo", ["foo", "bar", "baz"]), "foo_1");
        });

        it("should create unique names regardless of collisions", () => {
            assert.strictEqual(getUniqueColumnName("foo", ["foo", "foo_1", "foo_2", "bar", "baz"]), "foo_3");
        });
    });

    describe("getTargetableColumnNames", () => {
        it("should filter out preview columns", () => {
            assert.deepStrictEqual(getTargetableColumnNames(mockDataFrame), ["Index", "B", "C", "D", "E"]);
        });

        it("should filter out index columns if specified", () => {
            assert.deepStrictEqual(getTargetableColumnNames(mockDataFrame, false), ["B", "C", "D", "E"]);
        });
    });

    describe("getTargetableColumns", () => {
        it("should provide the grid index by default", () => {
            assert.deepStrictEqual(
                getTargetableColumns(mockDataFrame, {
                    colTransformer: (col) => ({ name: col.name, index: col.index })
                }),
                [
                    { name: "Index", index: 0 },
                    { name: "B", index: 2 },
                    { name: "C", index: 3 },
                    { name: "D", index: 4 },
                    { name: "E", index: 5 }
                ]
            );
        });

        it("should be able to provide an updated index", () => {
            assert.deepStrictEqual(
                getTargetableColumns(mockDataFrame, {
                    colTransformer: (col) => ({ name: col.name, index: col.index }),
                    adjustIndices: true
                }),
                [
                    { name: "Index", index: 0 },
                    { name: "B", index: 1 },
                    { name: "C", index: 2 },
                    { name: "D", index: 3 },
                    { name: "E", index: 4 }
                ]
            );

            assert.deepStrictEqual(
                getTargetableColumns(mockDataFrame, {
                    colTransformer: (col) => ({ name: col.name, index: col.index }),
                    adjustIndices: true,
                    keepIndex: false
                }),
                [
                    { name: "B", index: 1 },
                    { name: "C", index: 2 },
                    { name: "D", index: 3 },
                    { name: "E", index: 4 }
                ]
            );
        });
    });
});
