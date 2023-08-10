import { OperationCategory, PreviewStrategy, WranglerCodeExportFormat } from "@dw/orchestrator";
import {
    ColumnType,
    IDataFrameColumnStats,
    IDataFrameHeader,
    IDataFrameStats,
    IHistoryItem,
    PreviewAnnotationType,
    AsyncTask,
    DataImportOperationKey,
    OperationKey
} from "@dw/messaging";
import * as assert from "assert";
import { PandasEngine } from "./pandasEngine";
import { makeDataFrame } from "./operations/testUtil";
import { PandasDTypes } from "./types";

describe("PandasEngine", () => {
    describe("codeExporters", () => {
        describe("Export as function", () => {
            it("handles happy path for DataFrame loaded from CSV", async () => {
                const pandasEngine = new PandasEngine();
                const exportCodeAsFunction = pandasEngine.codeExporters[WranglerCodeExportFormat.Function];
                const historyItems: IHistoryItem[] = [
                    {
                        index: 0,
                        description: "Load data frame from CSV file",
                        code: "import pandas as pd\ndf = pd.read_csv(r'c:\\Users\\rose\\titanic.csv')",
                        variableName: "df_0",
                        targetedColumns: [],
                        operation: {
                            key: DataImportOperationKey.ReadCsv,
                            isDataImportOperation: true
                        }
                    },
                    {
                        index: 1,
                        description: "Drop column: 'Name'",
                        code: "df = df.drop(columns=['Name'])",
                        variableName: "df_1",
                        targetedColumns: [],
                        operation: {
                            key: OperationKey.Drop
                        }
                    }
                ];
                assert.equal(
                    await exportCodeAsFunction("df", historyItems),
                    [
                        "import pandas as pd",
                        "",
                        "def clean_data(df):",
                        "    # Drop column: 'Name'",
                        "    df = df.drop(columns=['Name'])",
                        "    return df",
                        "",
                        "# Load data frame from CSV file",
                        "df = pd.read_csv(r'c:\\Users\\rose\\titanic.csv')",
                        "",
                        "df_clean = clean_data(df.copy())",
                        "df_clean.head()"
                    ].join("\n")
                );
            });

            it("handles happy path for DataFrame loaded from kernel state", async () => {
                const pandasEngine = new PandasEngine();
                const exportCodeAsFunction = pandasEngine.codeExporters[WranglerCodeExportFormat.Function];
                const historyItems: IHistoryItem[] = [
                    {
                        index: 0,
                        description: "Loaded variable 'dataFrame' from kernel state",
                        code: "",
                        variableName: "df_0",
                        targetedColumns: [],
                        operation: {
                            key: DataImportOperationKey.Variable,
                            isDataImportOperation: true
                        }
                    },
                    {
                        index: 1,
                        description: "Drop column: 'Name'",
                        code: "df = df.drop(columns=['Name'])",
                        variableName: "df_1",
                        targetedColumns: [],
                        operation: {
                            key: OperationKey.Drop
                        }
                    }
                ];
                assert.equal(
                    await exportCodeAsFunction("df", historyItems),
                    [
                        "def clean_data(df):",
                        "    # Drop column: 'Name'",
                        "    df = df.drop(columns=['Name'])",
                        "    return df",
                        "",
                        "df_clean = clean_data(df.copy())",
                        "df_clean.head()"
                    ].join("\n")
                );
            });

            it("moves `import` commands to the top, sorted alphabetically", async () => {
                const pandasEngine = new PandasEngine();
                const exportCodeAsFunction = pandasEngine.codeExporters[WranglerCodeExportFormat.Function];
                const historyItems: IHistoryItem[] = [
                    {
                        index: 0,
                        description: "Load data",
                        code: 'import b as y\nimport a as x\nimport c as z\nprint("Hello, 🌍!")\ndf = a.load_data()',
                        variableName: "df_0",
                        targetedColumns: [],
                        operation: {
                            key: DataImportOperationKey.ReadCsv,
                            isDataImportOperation: true
                        }
                    },
                    {
                        index: 1,
                        description: "",
                        code: '# Some operation\ndef foo():\n    import A.a\n    from d import *\n    from c.a import blah\n    print("Goodbye")\nfoo()\ndf = blah.something(df)',
                        variableName: "df_1",
                        targetedColumns: [],
                        operation: {
                            key: OperationKey.CustomOperation
                        }
                    }
                ];
                assert.equal(
                    await exportCodeAsFunction("df", historyItems),
                    [
                        "from c.a import blah",
                        "from d import *",
                        "import a as x",
                        "import A.a",
                        "import b as y",
                        "import c as z",
                        "",
                        "def clean_data(df):",
                        "    # Some operation",
                        "    def foo():",
                        '        print("Goodbye")',
                        "    foo()",
                        "    df = blah.something(df)",
                        "    return df",
                        "",
                        "# Load data",
                        'print("Hello, 🌍!")',
                        "df = a.load_data()",
                        "",
                        "df_clean = clean_data(df.copy())",
                        "df_clean.head()"
                    ].join("\n")
                );
            });
        });

        describe("evaluateHistory", () => {
            it("can recreate a dataframe from a loaded file", async () => {
                const pandasEngine = new PandasEngine();
                const codeRequests: string[] = [];

                await pandasEngine.init((code) => {
                    codeRequests.push(code);
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                // Remove any requests made during initialization
                codeRequests.length = 0;

                await pandasEngine.evaluateHistory("df", [
                    {
                        index: 0,
                        code: "import pandas as pd\ndf = pd.read_csv('some/file.csv')",
                        description: "load from file",
                        variableName: "df",
                        targetedColumns: [],
                        operation: {
                            key: DataImportOperationKey.ReadCsv,
                            isDataImportOperation: true
                        }
                    },
                    {
                        index: 1,
                        code: "df = df.drop(['foo'])",
                        description: "drop column 'foo'",
                        variableName: "df",
                        targetedColumns: [],
                        operation: {
                            key: OperationKey.Drop
                        }
                    }
                ]);

                assert.deepStrictEqual(codeRequests, [
                    [
                        "",
                        'exec("""',
                        "import pandas as pd",
                        "",
                        "def clean_data(df):",
                        "    # drop column 'foo'",
                        "    df = df.drop(['foo'])",
                        "    return df",
                        "",
                        "# load from file",
                        "df = pd.read_csv('some/file.csv')",
                        "",
                        "_0 = clean_data(df)",
                        "del clean_data, df",
                        '__DW_SCOPE__["foo"]["locals"].update(locals())',
                        '""", {**globals(), **__DW_SCOPE__["foo"]["locals"]})',
                        ""
                    ].join("\n")
                ]);
            });

            it("can recreate a dataframe from a variable", async () => {
                const pandasEngine = new PandasEngine();
                const codeRequests: string[] = [];

                await pandasEngine.init((code) => {
                    codeRequests.push(code);
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                // Remove any requests made during initialization
                codeRequests.length = 0;

                await pandasEngine.evaluateHistory("df", [
                    {
                        index: 0,
                        code: "",
                        description: "load from variable",
                        variableName: "df",
                        targetedColumns: [],
                        operation: {
                            key: DataImportOperationKey.Variable,
                            isDataImportOperation: true
                        }
                    },
                    {
                        index: 1,
                        code: "df = df.drop(['foo'])",
                        description: "drop column 'foo'",
                        variableName: "df",
                        targetedColumns: [],
                        operation: {
                            key: OperationKey.Drop
                        }
                    }
                ]);

                assert.deepStrictEqual(codeRequests, [
                    '__DW_SCOPE__["foo"]["locals"]["df"] = df',
                    [
                        "",
                        'exec("""',
                        "def clean_data(df):",
                        "    # drop column 'foo'",
                        "    df = df.drop(['foo'])",
                        "    return df",
                        "",
                        "_0 = clean_data(df.copy())",
                        "del clean_data, df",
                        '__DW_SCOPE__["foo"]["locals"].update(locals())',
                        '""", {**globals(), **__DW_SCOPE__["foo"]["locals"]})',
                        ""
                    ].join("\n")
                ]);
            });
        });

        describe("Column stats reuse", () => {
            it("Can reuse column stats for previews", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        const df: IDataFrameHeader = makeDataFrame(
                            [
                                { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                                { name: "C", rawType: PandasDTypes.String, type: ColumnType.String },
                                { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                            ],
                            []
                        );
                        df.isPreview = true;
                        df.previewStrategy = PreviewStrategy.ModifiedColumns;
                        df.columns[1].annotations = {
                            annotationType: PreviewAnnotationType.Added
                        };
                        df.columns[2].annotations = {
                            annotationType: PreviewAnnotationType.Removed
                        };
                        return AsyncTask.resolve(JSON.stringify(df));
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const previousDataFrame = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const columnStats: Record<number, IDataFrameColumnStats> = {
                    0: {
                        missingCount: 1,
                        uniqueCount: 2
                    },
                    1: {
                        missingCount: 3,
                        uniqueCount: 4
                    }
                };
                previousDataFrame.getLoadedColumnStats = () => columnStats;

                const newDataFrame = await engine.inspectDataFrameVariableDiff(
                    "df2",
                    "df1",
                    PreviewStrategy.ModifiedColumns,
                    previousDataFrame
                );
                const newColumnStats = newDataFrame.getLoadedColumnStats();

                assert.equal(newColumnStats[0], columnStats[0]);
                assert.equal(newColumnStats[1], undefined);
                assert.equal(newColumnStats[2], columnStats[1]);
            });

            it("Reuses column stats when column order changes", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        const df: IDataFrameHeader = makeDataFrame(
                            [
                                { name: "C", rawType: PandasDTypes.String, type: ColumnType.String },
                                { name: "B", rawType: PandasDTypes.String, type: ColumnType.String },
                                { name: "A", rawType: PandasDTypes.String, type: ColumnType.String }
                            ],
                            []
                        );
                        df.isPreview = true;
                        df.previewStrategy = PreviewStrategy.ModifiedColumns;
                        return AsyncTask.resolve(JSON.stringify(df));
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const previousDataFrame = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "C", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const columnStats: Record<number, IDataFrameColumnStats> = {
                    0: {
                        missingCount: 1,
                        uniqueCount: 2
                    },
                    1: {
                        missingCount: 3,
                        uniqueCount: 4
                    },
                    2: {
                        missingCount: 5,
                        uniqueCount: 6
                    }
                };
                previousDataFrame.getLoadedColumnStats = () => columnStats;

                const newDataFrame = await engine.inspectDataFrameVariableDiff(
                    "df2",
                    "df1",
                    PreviewStrategy.ModifiedColumns,
                    previousDataFrame
                );
                const newColumnStats = newDataFrame.getLoadedColumnStats();

                assert.equal(newColumnStats[0], columnStats[2]);
                assert.equal(newColumnStats[1], columnStats[1]);
                assert.equal(newColumnStats[2], columnStats[0]);
            });

            it("Does not reuse column stats for row modifications", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        return AsyncTask.resolve(
                            JSON.stringify({
                                ...previousDataFrame,
                                isPreview: true
                            })
                        );
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const previousDataFrame = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const columnStats: Record<number, IDataFrameColumnStats> = {
                    0: {
                        missingCount: 1,
                        uniqueCount: 2
                    },
                    1: {
                        missingCount: 3,
                        uniqueCount: 4
                    }
                };
                previousDataFrame.getLoadedColumnStats = () => columnStats;

                const newDataFrame = await engine.inspectDataFrameVariableDiff(
                    "df2",
                    "df1",
                    PreviewStrategy.AddedOrRemovedRows,
                    previousDataFrame
                );
                const newColumnStats = newDataFrame.getLoadedColumnStats();

                assert.equal(newColumnStats[0], undefined);
                assert.equal(newColumnStats[1], undefined);
            });

            it("Can reuse column stats after previewing", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        return AsyncTask.resolve(
                            JSON.stringify(
                                makeDataFrame(
                                    [
                                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                                    ],
                                    []
                                )
                            )
                        );
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const previewDf = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "C", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const columnStats: Record<number, IDataFrameColumnStats> = {
                    0: {
                        missingCount: 1,
                        uniqueCount: 2
                    },
                    1: {
                        missingCount: 3,
                        uniqueCount: 4
                    },
                    2: {
                        missingCount: 5,
                        uniqueCount: 6
                    }
                };
                previewDf.isPreview = true;
                previewDf.previewStrategy = PreviewStrategy.ModifiedColumns;
                previewDf.columns[1].annotations = {
                    annotationType: PreviewAnnotationType.Removed
                };
                previewDf.columns[2].annotations = {
                    annotationType: PreviewAnnotationType.Added
                };
                previewDf.getLoadedColumnStats = () => columnStats;

                const newDataFrame = await engine.inspectDataFrameVariable("df3", previewDf);
                const newColumnStats = newDataFrame.getLoadedColumnStats();

                assert.equal(newColumnStats[0], columnStats[0]);
                assert.equal(newColumnStats[1], columnStats[2]);
            });
        });

        describe("Header stats reuse", () => {
            it("Can reuse header stats for previews", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        return AsyncTask.resolve(
                            JSON.stringify({
                                ...df,
                                isPreview: true,
                                previewStrategy: PreviewStrategy.NoneWithCachedStats
                            })
                        );
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const df = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const stats: IDataFrameStats = {
                    size: 0,
                    missingValueCellsCount: 0,
                    missingValueRowsCount: 0,
                    missingValuesByColumn: [],
                    duplicateRowsCount: 0
                };
                df.tryGetStats = () => stats;
                df.getLoadedColumnStats = () => ({});

                const newDataFrame = await engine.inspectDataFrameVariableDiff(
                    "df2",
                    "df1",
                    PreviewStrategy.NoneWithCachedStats,
                    df
                );
                const newStats = newDataFrame.tryGetStats();

                assert.equal(newStats, stats);
            });

            it("Does not reuse header stats if they may have been modified", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        return AsyncTask.resolve(
                            JSON.stringify({
                                ...df,
                                isPreview: true
                            })
                        );
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const df = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const stats: IDataFrameStats = {
                    size: 0,
                    missingValueCellsCount: 0,
                    missingValueRowsCount: 0,
                    missingValuesByColumn: [],
                    duplicateRowsCount: 0
                };
                df.tryGetStats = () => stats;
                df.getLoadedColumnStats = () => ({});

                const newDataFrame = await engine.inspectDataFrameVariableDiff(
                    "df2",
                    "df1",
                    PreviewStrategy.ModifiedColumns,
                    df
                );
                const newStats = newDataFrame.tryGetStats();

                assert.equal(newStats, null);
            });

            it("Can reuse header stats after previewing", async () => {
                const engine = new PandasEngine();
                await engine.init((code) => {
                    if (!code.includes("__DW_INIT__") && code.includes("get_dataframe_info")) {
                        return AsyncTask.resolve(
                            JSON.stringify(
                                makeDataFrame(
                                    [
                                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                                    ],
                                    []
                                )
                            )
                        );
                    }
                    return AsyncTask.resolve('{"id": "foo"}');
                }, true);

                const previewDf = makeDataFrame(
                    [
                        { name: "A", rawType: PandasDTypes.String, type: ColumnType.String },
                        { name: "B", rawType: PandasDTypes.String, type: ColumnType.String }
                    ],
                    []
                );
                const stats: IDataFrameStats = {
                    size: 0,
                    missingValueCellsCount: 0,
                    missingValueRowsCount: 0,
                    missingValuesByColumn: [],
                    duplicateRowsCount: 0
                };
                previewDf.isPreview = true;
                previewDf.previewStrategy = PreviewStrategy.NoneWithCachedStats;
                previewDf.tryGetStats = () => stats;
                previewDf.getLoadedColumnStats = () => ({});

                const newDataFrame = await engine.inspectDataFrameVariable("df3", previewDf);
                const newStats = newDataFrame.tryGetStats();

                assert.equal(newStats, stats);
            });
        });
    });

    describe("indentCode", () => {
        it("should do nothing if there are no newlines", () => {
            const pandasEngine = new PandasEngine();
            assert.strictEqual(pandasEngine.indentCode("print('hi')", 3), "print('hi')");
        });

        it("should indent whenever there is a newline", () => {
            const pandasEngine = new PandasEngine();
            assert.strictEqual(
                pandasEngine.indentCode("print('hi')\nprint('bye')", 3),
                "print('hi')\n            print('bye')"
            );
        });

        it("should ignore newlines in strings", () => {
            const pandasEngine = new PandasEngine();
            assert.strictEqual(
                pandasEngine.indentCode(`print("'foo\n")\nprint(1)`, 1),
                `print("'foo\n")\n    print(1)`
            );
            assert.strictEqual(
                pandasEngine.indentCode(
                    `print('hi')
print("""
A multiline string
""")
print('''
Another one
''')
print('bye')`,
                    3
                ),
                `print('hi')
            print("""
A multiline string
""")
            print('''
Another one
''')
            print('bye')`
            );
        });
    });
});
