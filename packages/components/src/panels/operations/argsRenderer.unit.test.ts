import { ArgType, ColumnType, createArg, IDataFrameHeader, PreviewAnnotationType } from "@dw/messaging";
import { LocalizedStrings } from "../../localization";
import { renderOperationPanelArgument } from "./argsRenderer";
import {
    IArgGroupFieldProps,
    IBooleanFieldProps,
    ICategoryFieldProps,
    IFloatFieldProps,
    IIntegerFieldProps,
    ITargetFieldProps,
    IOperationsPanelArgumentRenderers,
    IOperationsPanelState,
    IStringFieldProps
} from "./types";

function isObject(item: any) {
    return item && typeof item === "object" && !Array.isArray(item);
}

function isShallow(item: any) {
    return Array.isArray(item) && item.find((item) => typeof item === "object") ? false : true;
}

// see: https://stackoverflow.com/a/34749873
// we need a deep merge to make sure that our mocked setState calls propagate appropriately
function assign(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                assign(target[key], source[key]);
            } else {
                if (isShallow(source[key])) Object.assign(target, { [key]: source[key] });
                else {
                    if (!target[key]) Object.assign(target, { [key]: [] });
                    Object.assign(target, {
                        [key]: source[key].map((item: any, index: number) => assign(target[key][index] || {}, item))
                    });
                }
            }
        }
    }

    return assign(target, ...sources);
}

function unpackElements<T extends any[]>(elements: Array<JSX.Element | null>): T {
    return elements.filter(Boolean).map((fragment) => {
        const children = (fragment!.props as any).children;
        if ("subMenuArgs" in children) {
            return {
                ...children,
                subMenuArgs: children.subMenuArgs.map(unpackElements)
            };
        }
        return children;
    }) as T;
}

const mockDataFrame = {
    columns: [
        {
            name: "index",
            key: "'index'",
            index: 0,
            type: ColumnType.Integer,
            rawType: "int64"
        },
        {
            name: "foo",
            key: "'foo'",
            index: 1,
            type: ColumnType.String,
            rawType: "object"
        },
        {
            name: "bar",
            key: "'bar'",
            index: 2,
            type: ColumnType.Float,
            rawType: "float64"
        }
    ]
} as IDataFrameHeader;
const mockedArgsRenderers: Required<IOperationsPanelArgumentRenderers> = {
    onRenderBooleanField: (props) => props as any,
    onRenderStringField: (props) => props as any,
    onRenderIntegerField: (props) => props as any,
    onRenderFloatField: (props) => props as any,
    onRenderTimedeltaField: (props) => props as any,
    onRenderDatetimeField: (props) => props as any,
    onRenderCategoryField: (props) => props as any,
    onRenderArgGroupField: (props) => props as any,
    onRenderTargetField: (props) => props as any,
    onRenderFormulaField: (props) => props as any
};

describe("Args renderer tests", () => {
    describe("renderOperationPanelArgument", () => {
        let mockState = {
            selectedArgs: {}
        } as IOperationsPanelState;

        function setState(updatedState: any) {
            assign(mockState, updatedState);
        }

        function getStateWithArgs(args: any) {
            mockState.selectedArgs = args;
            return mockState.selectedArgs;
        }

        beforeEach(() => {
            mockState = {
                selectedArgs: {}
            } as IOperationsPanelState;
        });

        describe("String args", () => {
            it("should handle string args", () => {
                const stringArg = createArg("SomeArg", ArgType.String, undefined, "SomeArgName");
                const rendered = unpackElements<[IStringFieldProps]>(
                    renderOperationPanelArgument({
                        arg: stringArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({}),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: undefined });
                expect(mockState).toEqual({
                    selectedArgs: {}
                });

                // update state
                rendered[0].onChange("foo");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: "foo"
                    }
                });
            });

            it("should handle string args and render values", () => {
                const stringArg = createArg("SomeArg", ArgType.String, undefined, "SomeArgName");
                const rendered = unpackElements<[IStringFieldProps]>(
                    renderOperationPanelArgument({
                        arg: stringArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: "someText"
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: "someText" });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: "someText"
                    }
                });

                // update state
                rendered[0].onChange("foo");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: "foo"
                    }
                });
            });
        });

        describe("Boolean args", () => {
            it("should handle boolean args", () => {
                const booleanArg = createArg("SomeArg", ArgType.Boolean, undefined, "SomeArgName");
                const rendered = unpackElements<[IBooleanFieldProps]>(
                    renderOperationPanelArgument({
                        arg: booleanArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({}),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: undefined });
                expect(mockState).toEqual({
                    selectedArgs: {}
                });

                // update state
                rendered[0].onChange(false);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: false
                    }
                });
            });

            it("should handle boolean args and render values", () => {
                const booleanArg = createArg("SomeArg", ArgType.Boolean, undefined, "SomeArgName");
                const rendered = unpackElements<[IBooleanFieldProps]>(
                    renderOperationPanelArgument({
                        arg: booleanArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({ SomeArg: true }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: true });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: true
                    }
                });

                // update state
                rendered[0].onChange(false);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: false
                    }
                });
            });
        });

        describe("Category args", () => {
            it("should handle category args", () => {
                const categoryArg = createArg(
                    "SomeArg",
                    ArgType.Category,
                    {
                        choices: [
                            {
                                key: "foo",
                                label: "Foo"
                            },
                            {
                                key: "bar",
                                label: "Bar"
                            }
                        ]
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[ICategoryFieldProps]>(
                    renderOperationPanelArgument({
                        arg: categoryArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: "foo"
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: "foo" });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: "foo"
                        }
                    }
                });

                // update state
                rendered[0].onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: "bar"
                        }
                    }
                });
            });

            it("should handle sub-arguments based on the selection", () => {
                const categoryArg = createArg(
                    "SomeArg",
                    ArgType.Category,
                    {
                        choices: [
                            {
                                key: "foo",
                                label: "Foo"
                            },
                            {
                                key: "bar",
                                label: "Bar"
                            }
                        ],
                        subMenuByChoice: {
                            foo: [
                                createArg(
                                    "NestedArg1",
                                    ArgType.String,
                                    {
                                        default: "foo"
                                    },
                                    "NestedArgName1"
                                )
                            ],
                            bar: [
                                createArg(
                                    "NestedArg2",
                                    ArgType.String,
                                    {
                                        default: "bar"
                                    },
                                    "NestedArgName2"
                                )
                            ]
                        }
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[ICategoryFieldProps, IStringFieldProps]>(
                    renderOperationPanelArgument({
                        arg: categoryArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: "foo",
                                subMenu: {
                                    NestedArg1: "foo"
                                }
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({ errorMessage: undefined, label: "SomeArgName", value: "foo" });
                expect(rendered[1]).toMatchObject({ errorMessage: undefined, label: "NestedArgName1", value: "foo" });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: "foo",
                            subMenu: {
                                NestedArg1: "foo"
                            }
                        }
                    }
                });

                // update state
                rendered[0].onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: "bar",
                            subMenu: {
                                NestedArg2: "bar"
                            }
                        }
                    }
                });
            });
        });

        describe("TypeDependent args", () => {
            it("should handle type-dependent args", () => {
                const typeDependentArg = createArg(
                    "SomeArgWrapper",
                    ArgType.TypeDependent,
                    {
                        boolean: [
                            createArg("SomeBooleanArg", ArgType.String, { default: "boolean" }, "SomeBooleanArg")
                        ],
                        category: [
                            createArg("SomeCategoryArg", ArgType.String, { default: "category" }, "SomeCategoryArg")
                        ],
                        datetime: [
                            createArg("SomeDatetimeArg", ArgType.String, { default: "datetime" }, "SomeDatetimeArg")
                        ],
                        float: [createArg("SomeFloatArg", ArgType.String, { default: "float" }, "SomeFloatArg")],
                        integer: [
                            createArg("SomeIntegerArg", ArgType.String, { default: "integer" }, "SomeIntegerArg")
                        ],
                        string: [createArg("SomeStringArg", ArgType.String, { default: "string" }, "SomeStringArg")],
                        timedelta: [
                            createArg("SomeTimedeltaArg", ArgType.String, { default: "timedelta" }, "SomeTimedeltaArg")
                        ],
                        complex: [
                            createArg("SomeComplexArg", ArgType.String, { default: "complex" }, "SomeComplexArg")
                        ],
                        period: [createArg("SomePeriodArg", ArgType.String, { default: "period" }, "SomePeriodArg")],
                        interval: [
                            createArg("SomeIntervalArg", ArgType.String, { default: "interval" }, "SomeIntervalArg")
                        ],
                        unknown: [createArg("SomeUnknownArg", ArgType.String, { default: "unknown" }, "SomeUnknownArg")]
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IStringFieldProps]>(
                    renderOperationPanelArgument({
                        arg: typeDependentArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArgWrapper: {
                                SomeBooleanArg: "boolean"
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        typeContext: ColumnType.Boolean,
                        targetsContext: [mockDataFrame.columns[1]]
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeBooleanArg",
                    value: "boolean"
                });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArgWrapper: {
                            SomeBooleanArg: "boolean"
                        }
                    }
                });

                // update state
                rendered[0].onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArgWrapper: {
                            SomeBooleanArg: "bar"
                        }
                    }
                });
            });
        });

        describe("ArgGroup args", () => {
            it("should handle arg group args with one nested argument", () => {
                const argGroupArg = createArg(
                    "SomeArg",
                    ArgType.ArgGroup,
                    {
                        args: [
                            createArg(
                                "NestedArg1",
                                ArgType.String,
                                {
                                    default: "foo"
                                },
                                "NestedArgName1"
                            )
                        ],
                        addGroupLabel: "Add group"
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IArgGroupFieldProps]>(
                    renderOperationPanelArgument({
                        arg: argGroupArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                children: []
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    subMenuArgs: []
                });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            children: []
                        }
                    }
                });

                // update state by adding group
                rendered[0].onAddGroupButtonClick();
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo"
                                }
                            ]
                        }
                    }
                });
            });

            it("should handle arg group args with one nested argument and render values", () => {
                const argGroupArg = createArg(
                    "SomeArg",
                    ArgType.ArgGroup,
                    {
                        args: [
                            createArg(
                                "NestedArg1",
                                ArgType.String,
                                {
                                    default: "foo"
                                },
                                "NestedArgName1"
                            )
                        ],
                        addGroupLabel: "Add group"
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IArgGroupFieldProps]>(
                    renderOperationPanelArgument({
                        arg: argGroupArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                children: [
                                    {
                                        NestedArg1: "foo"
                                    }
                                ]
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    subMenuArgs: [
                        [
                            {
                                errorMessage: undefined,
                                label: "NestedArgName1",
                                value: "foo"
                            }
                        ]
                    ]
                });
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo"
                                }
                            ]
                        }
                    }
                });

                const nestedArg1Rendered = rendered[0].subMenuArgs[0][0] as any as IStringFieldProps;
                nestedArg1Rendered.onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar"
                                }
                            ]
                        }
                    }
                });

                // update state by adding group
                rendered[0].onAddGroupButtonClick();

                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar"
                                },
                                {
                                    NestedArg1: "foo"
                                }
                            ]
                        }
                    }
                });

                // update state by deleting group
                rendered[0].onDeleteGroupButtonClick(0);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo"
                                }
                            ]
                        }
                    }
                });
            });

            it("should handle arg group args with two nested arguments", () => {
                const argGroupArg = createArg(
                    "SomeArg",
                    ArgType.ArgGroup,
                    {
                        args: [
                            createArg("NestedArg1", ArgType.String, undefined, "NestedArgName1"),
                            createArg("NestedArg2", ArgType.Boolean, undefined, "NestedArgName2")
                        ],
                        addGroupLabel: "Add group"
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IArgGroupFieldProps]>(
                    renderOperationPanelArgument({
                        arg: argGroupArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({}),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    subMenuArgs: []
                });
                expect(mockState).toEqual({
                    selectedArgs: {}
                });

                // update state
                rendered[0].onAddGroupButtonClick();
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [{}]
                        }
                    }
                });
            });

            it("should handle arg group args with two nested arguments and render values", () => {
                const argGroupArg = createArg(
                    "SomeArg",
                    ArgType.ArgGroup,
                    {
                        args: [
                            createArg(
                                "NestedArg1",
                                ArgType.String,
                                {
                                    default: "foo"
                                },
                                "NestedArgName1"
                            ),
                            createArg(
                                "NestedArg2",
                                ArgType.Boolean,
                                {
                                    default: false
                                },
                                "NestedArgName2"
                            )
                        ],
                        addGroupLabel: "Add group"
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IArgGroupFieldProps]>(
                    renderOperationPanelArgument({
                        arg: argGroupArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                children: [
                                    {
                                        NestedArg1: "foo",
                                        NestedArg2: false
                                    }
                                ]
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    subMenuArgs: [
                        [
                            {
                                errorMessage: undefined,
                                label: "NestedArgName1",
                                value: "foo"
                            },
                            {
                                errorMessage: undefined,
                                label: "NestedArgName2",
                                value: false
                            }
                        ]
                    ]
                });
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false
                                }
                            ]
                        }
                    }
                });

                const nestedArg1Rendered = rendered[0].subMenuArgs[0][0] as any as IStringFieldProps;
                nestedArg1Rendered.onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: false
                                }
                            ]
                        }
                    }
                });

                const nestedArg2Rendered = rendered[0].subMenuArgs[0][1] as any as IBooleanFieldProps;
                nestedArg2Rendered.onChange(true);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true
                                }
                            ]
                        }
                    }
                });

                // update state by adding group
                rendered[0].onAddGroupButtonClick();

                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true
                                },
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false
                                }
                            ]
                        }
                    }
                });

                // update state by deleting group
                rendered[0].onDeleteGroupButtonClick(0);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false
                                }
                            ]
                        }
                    }
                });
            });

            it("should handle arg group args with a nested group and render values", () => {
                const argGroupArg = createArg(
                    "SomeArg",
                    ArgType.ArgGroup,
                    {
                        args: [
                            createArg(
                                "NestedArg1",
                                ArgType.String,
                                {
                                    default: "foo"
                                },
                                "NestedArgName1"
                            ),
                            createArg(
                                "NestedArg2",
                                ArgType.Boolean,
                                {
                                    default: false
                                },
                                "NestedArgName2"
                            ),
                            createArg(
                                "NestedArg3",
                                ArgType.ArgGroup,
                                {
                                    args: [
                                        createArg(
                                            "DeeplyNestedArg1",
                                            ArgType.Integer,
                                            {
                                                default: 2
                                            },
                                            "DeeplyNestedArgName1"
                                        )
                                    ],
                                    addGroupLabel: "Add inner group"
                                },
                                "NestedArgName3"
                            )
                        ],
                        addGroupLabel: "Add group"
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[IArgGroupFieldProps]>(
                    renderOperationPanelArgument({
                        arg: argGroupArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                children: [
                                    {
                                        NestedArg1: "foo",
                                        NestedArg2: false,
                                        NestedArg3: {
                                            children: [
                                                {
                                                    DeeplyNestedArg1: 2
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    subMenuArgs: [
                        [
                            {
                                errorMessage: undefined,
                                label: "NestedArgName1",
                                value: "foo"
                            },
                            {
                                errorMessage: undefined,
                                label: "NestedArgName2",
                                value: false
                            },
                            {
                                errorMessage: undefined,
                                label: "NestedArgName3",
                                subMenuArgs: [
                                    [
                                        {
                                            errorMessage: undefined,
                                            label: "DeeplyNestedArgName1",
                                            value: 2
                                        }
                                    ]
                                ]
                            }
                        ]
                    ]
                });
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                const nestedArg1Rendered = rendered[0].subMenuArgs[0][0] as any as IStringFieldProps;
                nestedArg1Rendered.onChange("bar");
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: false,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                const nestedArg2Rendered = rendered[0].subMenuArgs[0][1] as any as IBooleanFieldProps;
                nestedArg2Rendered.onChange(true);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                const nestedArg3Rendered = rendered[0].subMenuArgs[0][2] as any as IArgGroupFieldProps;
                nestedArg3Rendered.onAddGroupButtonClick();
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            },
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                const deeplyNestedArg1Rendered = nestedArg3Rendered.subMenuArgs[0][0] as any as IIntegerFieldProps;
                deeplyNestedArg1Rendered.onChange(7);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 7
                                            },
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                nestedArg3Rendered.onDeleteGroupButtonClick(0);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                });

                // update state by adding group
                rendered[0].onAddGroupButtonClick();

                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "bar",
                                    NestedArg2: true,
                                    NestedArg3: {
                                        children: [
                                            {
                                                DeeplyNestedArg1: 2
                                            }
                                        ]
                                    }
                                },
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false,
                                    NestedArg3: {
                                        children: []
                                    }
                                }
                            ]
                        }
                    }
                });

                // update state by deleting group
                rendered[0].onDeleteGroupButtonClick(0);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            children: [
                                {
                                    NestedArg1: "foo",
                                    NestedArg2: false,
                                    NestedArg3: {
                                        children: []
                                    }
                                }
                            ]
                        }
                    }
                });
            });
        });

        describe("Target args", () => {
            const mockDataFrameTargettests = {
                columns: [
                    {
                        name: "index",
                        key: "'index'",
                        index: 0,
                        type: ColumnType.Integer,
                        rawType: "int64"
                    },
                    {
                        name: "foo",
                        key: "'foo'",
                        index: 1,
                        type: ColumnType.String,
                        rawType: "object"
                    },
                    {
                        name: "bar",
                        key: "'bar'",
                        index: 2,
                        type: ColumnType.Float,
                        rawType: "float64"
                    },
                    {
                        name: "baz",
                        key: "'baz'",
                        index: 3,
                        type: ColumnType.Float,
                        rawType: "float64"
                    }
                ]
            } as IDataFrameHeader;

            it("should handle column target args", () => {
                const targetArg = createArg("SomeArg", ArgType.Target, undefined, "SomeArgName");
                const rendered = unpackElements<[ITargetFieldProps]>(
                    renderOperationPanelArgument({
                        arg: targetArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: [],
                                subMenu: {}
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    choices: [
                        {
                            key: "'foo'",
                            label: "foo"
                        },
                        {
                            key: "'bar'",
                            label: "bar"
                        }
                    ]
                });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: [],
                            subMenu: {}
                        }
                    }
                });
            });

            it("should handle column target args and hide preview columns", () => {
                const targetArg = createArg("SomeArg", ArgType.Target, undefined, "SomeArgName");
                const rendered = unpackElements<[ITargetFieldProps]>(
                    renderOperationPanelArgument({
                        arg: targetArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: [],
                                subMenu: {}
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: {
                            ...mockDataFrame,
                            columns: [
                                {
                                    name: "index",
                                    key: "'index'",
                                    index: 0,
                                    type: ColumnType.Integer,
                                    rawType: "int64"
                                },
                                {
                                    name: "foo",
                                    key: "'foo'",
                                    index: 1,
                                    type: ColumnType.String,
                                    rawType: "object"
                                },
                                {
                                    name: "foo (preview)",
                                    key: "'foo'",
                                    index: 2,
                                    type: ColumnType.String,
                                    rawType: "object",
                                    annotations: {
                                        annotationType: PreviewAnnotationType.Added
                                    }
                                },
                                {
                                    name: "bar",
                                    key: "'bar'",
                                    index: 3,
                                    type: ColumnType.Float,
                                    rawType: "float64"
                                }
                            ] as any
                        }
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    choices: [
                        {
                            key: "'foo'",
                            label: "foo"
                        },
                        {
                            key: "'bar'",
                            label: "bar"
                        }
                    ]
                });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: [],
                            subMenu: {}
                        }
                    }
                });
                // update state
                rendered[0].onChange(["'bar'"]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "bar",
                                    key: "'bar'",
                                    index: 2 // NOTE: the index here should be 2 and not 3, since we subtract the preview column
                                }
                            ],
                            subMenu: {}
                        }
                    }
                });
            });

            it("should handle column target args and move disabled columns to the end", () => {
                const targetArg = createArg(
                    "SomeArg",
                    ArgType.Target,
                    {
                        targetFilter: {
                            allowedTypes: [ColumnType.Float]
                        }
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[ITargetFieldProps]>(
                    renderOperationPanelArgument({
                        arg: targetArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: [],
                                subMenu: {}
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered[0]).toMatchObject({
                    errorMessage: undefined,
                    label: "SomeArgName",
                    choices: [
                        {
                            key: "'bar'",
                            label: "bar"
                        },
                        {
                            key: "'foo'",
                            label: "foo",
                            disabledReason:
                                "Cannot select target 'foo'. Type 'object' is not allowed for this operation."
                        }
                    ]
                });
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: [],
                            subMenu: {}
                        }
                    }
                });
            });

            it("should handle column target args and render values based on type", () => {
                const targetArg = createArg(
                    "SomeArg",
                    ArgType.Target,
                    {
                        subMenu: [
                            createArg("TypedNestedArg", ArgType.TypeDependent, {
                                [ColumnType.Boolean]: [],
                                [ColumnType.Category]: [],
                                [ColumnType.Complex]: [],
                                [ColumnType.Datetime]: [],
                                [ColumnType.Float]: [
                                    createArg(
                                        "FloatNestedArg1",
                                        ArgType.Boolean,
                                        { default: false },
                                        "FloatNestedArgName1"
                                    )
                                ],
                                [ColumnType.Integer]: [],
                                [ColumnType.Interval]: [],
                                [ColumnType.Period]: [],
                                [ColumnType.String]: [
                                    createArg(
                                        "StringNestedArg1",
                                        ArgType.Float,
                                        { default: 2.0 },
                                        "StringNestedArgName1"
                                    )
                                ],
                                [ColumnType.Timedelta]: [],
                                [ColumnType.Unknown]: []
                            })
                        ]
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[ITargetFieldProps, IFloatFieldProps]>(
                    renderOperationPanelArgument({
                        arg: targetArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: [
                                    {
                                        name: "foo",
                                        key: "'foo'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    TypedNestedArg: { StringNestedArg1: 1.5 }
                                }
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrame
                    })
                );
                expect(rendered).toMatchObject([
                    {
                        errorMessage: undefined,
                        label: "SomeArgName",
                        choices: [
                            {
                                key: "'foo'",
                                label: "foo"
                            },
                            {
                                key: "'bar'",
                                label: "bar"
                            }
                        ]
                    },
                    {
                        errorMessage: undefined,
                        label: "StringNestedArgName1",
                        value: 1.5
                    }
                ]);
                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "foo",
                                    key: "'foo'",
                                    index: 1
                                }
                            ],
                            subMenu: {
                                TypedNestedArg: { StringNestedArg1: 1.5 }
                            }
                        }
                    }
                });

                const floatArgRendered = rendered[1];
                floatArgRendered.onChange(2.5);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "foo",
                                    key: "'foo'",
                                    index: 1
                                }
                            ],
                            subMenu: {
                                TypedNestedArg: { StringNestedArg1: 2.5 }
                            }
                        }
                    }
                });

                // update state
                rendered[0].onChange(["'bar'"]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "bar",
                                    key: "'bar'",
                                    index: 2
                                }
                            ],
                            subMenu: {
                                TypedNestedArg: { FloatNestedArg1: false }
                            }
                        }
                    }
                });
            });

            it("Can use the custom args", () => {
                const targetArg = createArg(
                    "SomeArg",
                    ArgType.Target,
                    {
                        subMenu: [
                            createArg(
                                "VariableColumnArg1",
                                ArgType.VariableColumnType,
                                undefined,
                                "VariableColumnArg11Name"
                            )
                        ],
                        keepSubMenuStateOnTargetChange: true
                    },
                    "SomeArgName"
                );
                const rendered = unpackElements<[ITargetFieldProps, IIntegerFieldProps]>(
                    renderOperationPanelArgument({
                        arg: targetArg,
                        isPanelDisabled: false,
                        selectedArgs: getStateWithArgs({
                            SomeArg: {
                                value: [
                                    {
                                        name: "foo",
                                        key: "'foo'",
                                        index: 1
                                    }
                                ],
                                subMenu: {
                                    VariableColumnArg1: "stringvalue"
                                }
                            }
                        }),
                        locStrings: LocalizedStrings.Operations,
                        setState,
                        startPreview: () => {},
                        renderers: mockedArgsRenderers,
                        dataFrame: mockDataFrameTargettests
                    })
                );
                expect(rendered).toMatchObject([
                    {
                        errorMessage: undefined,
                        label: "SomeArgName",
                        choices: [
                            {
                                key: "'foo'",
                                label: "foo"
                            },
                            {
                                key: "'bar'",
                                label: "bar"
                            },
                            {
                                key: "'baz'",
                                label: "baz"
                            }
                        ]
                    },
                    {
                        errorMessage: undefined,
                        label: "VariableColumnArg11Name",
                        value: "stringvalue"
                    }
                ]);

                expect(mockState).toEqual({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "foo",
                                    key: "'foo'",
                                    index: 1
                                }
                            ],
                            subMenu: {
                                VariableColumnArg1: "stringvalue"
                            }
                        }
                    }
                });

                rendered[0].onChange(["'bar'"]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "bar",
                                    key: "'bar'",
                                    index: 2
                                }
                            ],
                            subMenu: {
                                VariableColumnArg1: 0
                            }
                        }
                    }
                });

                const stringArgRendered = rendered[1];
                stringArgRendered.onChange(70);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "bar",
                                    key: "'bar'",
                                    index: 2
                                }
                            ],
                            subMenu: {
                                VariableColumnArg1: 70
                            }
                        }
                    }
                });

                rendered[0].onChange(["'baz'"]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "baz",
                                    key: "'baz'",
                                    index: 3
                                }
                            ],
                            subMenu: {
                                VariableColumnArg1: 70
                            }
                        }
                    }
                });

                rendered[0].onChange(["'foo'"]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [
                                {
                                    name: "foo",
                                    key: "'foo'",
                                    index: 1
                                }
                            ],
                            subMenu: {
                                VariableColumnArg1: ""
                            }
                        }
                    }
                });

                rendered[0].onChange([]);
                expect(mockState).toMatchObject({
                    selectedArgs: {
                        SomeArg: {
                            value: [],
                            subMenu: {
                                VariableColumnArg1: null
                            }
                        }
                    }
                });
            });
        });
    });
});
