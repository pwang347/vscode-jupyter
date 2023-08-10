// Base operation contexts to be augmented

import {
    AsyncTask,
    ColumnType,
    formatString,
    IColumnTarget,
    IDataFrame,
    IDataFrameColumn,
    IDataFrameRow,
    TranslationValidationResultType
} from "@dw/messaging";
import {
    IBaseProgram,
    IDataImportOperationWithBaseProgram,
    IDataWranglerOperationContext,
    IGenericDataImportOperation,
    IGenericOperation,
    IOperationWithBaseProgram,
    IWranglerStartSessionContext,
    LocalizedStrings,
    OperationCodeGenResultType
} from "@dw/orchestrator";
import * as assert from "assert";

export function makeDataFrame(
    columns: { name: string; rawType: string; type: ColumnType }[],
    rows: IDataFrameRow[]
): IDataFrame {
    return {
        columns: columns.map((c) => ({ ...c, key: c.name }) as IDataFrameColumn),
        rowCount: rows.length,
        getLoadedRows: () => rows,
        loadRows: (minCount, slice) => AsyncTask.resolve(slice ? rows.slice(0, minCount) : rows),
        loadStats() {
            throw new Error("unimplemented");
        },
        tryGetStats() {
            throw new Error("unimplemented");
        },
        loadColumnStats() {
            throw new Error("unimplemented");
        },
        tryGetColumnStats() {
            throw new Error("unimplemented");
        },
        getLoadedColumnStats() {
            throw new Error("unimplemented");
        },
        async interruptLoading() {},
        enableLoading: function () {},
        cleanCache() {},
        variableName: "df",
        shape: {
            rows: rows.length,
            columns: columns.length
        },
        historyItem: null!,
        indexColumnKey: "index"
    };
}

export const getDataImportOperationContext = <TArgs>(args: TArgs): IWranglerStartSessionContext<TArgs> => ({
    engineName: "pandas",
    args,
    defaultVariableName: "df",
    locale: "en",
    getLocalizedStrings: () => LocalizedStrings.Orchestrator,
    formatString
});

export const getBaseColumnOperationContext = <TArgs>(args: TArgs): IDataWranglerOperationContext<TArgs> => ({
    engineId: "pandas",
    engineName: "pandas",
    args,
    dataframe: makeDataFrame(
        [
            {
                name: "index",
                rawType: "int64",
                type: ColumnType.Integer
            },
            {
                name: "Some_column",
                rawType: "object",
                type: ColumnType.String
            },
            {
                name: "Another_column",
                rawType: "object",
                type: ColumnType.String
            },
            {
                name: "Yet_another_column",
                rawType: "object",
                type: ColumnType.String
            }
        ],
        [
            {
                data: [0, "foo", "0", "a"],
                index: 0
            },
            {
                data: [1, "hello", "1", "b"],
                index: 1
            },
            {
                data: [2, "world", "2", "c"],
                index: 2
            }
        ]
    ),
    gridCellEdits: [],
    variableName: "df",
    dependencies: {
        satisfied: {},
        unsatisfied: {}
    },
    locale: "en",
    proseApiClient: {
        deriveColumn: async () => {
            throw new Error("Not implemented");
        }
    },
    naturalLanguageClient: {} as any,
    getLocalizedStrings: () => {
        return LocalizedStrings.Orchestrator;
    },
    formatString,
    isFirstRun: true,
    redactCustomRawType: (s) => s,
    stringifyValue: (v) => JSON.stringify(v)
});

export const getZeroColumnOperationContext = <TArgs, TSubMenuArgs>(
    args: TArgs,
    subMenuArgs: TSubMenuArgs = {} as any
): IDataWranglerOperationContext<
    {
        TargetColumns: {
            value: IColumnTarget[];
            subMenu: TSubMenuArgs;
        };
    } & TArgs
> =>
    getBaseColumnOperationContext({
        TargetColumns: {
            value: [],
            subMenu: subMenuArgs
        },
        ...args
    });

export const getOneColumnOperationContext = <TArgs, TSubMenuArgs>(
    args: TArgs,
    subMenuArgs: TSubMenuArgs = {} as any,
    typeReplacement?: {
        rawType: string;
        type: ColumnType;
    }
): IDataWranglerOperationContext<
    {
        TargetColumns: {
            value: IColumnTarget[];
            subMenu: TSubMenuArgs;
        };
    } & TArgs
> => {
    const context = getBaseColumnOperationContext({
        TargetColumns: {
            value: [
                {
                    index: 1,
                    name: "Some_column",
                    key: "'Some_column'"
                }
            ],
            subMenu: subMenuArgs
        },
        ...args
    });
    if (typeReplacement) {
        context.dataframe.columns[1].rawType = typeReplacement.rawType;
        context.dataframe.columns[1].type = typeReplacement.type;
    }
    return context;
};

export const getOneColumnOperationContextWithSingleQuoteInName = <TArgs, TSubMenuArgs>(
    args: TArgs,
    subMenuArgs: TSubMenuArgs = {} as any
): IDataWranglerOperationContext<
    {
        TargetColumns: {
            value: IColumnTarget[];
            subMenu: TSubMenuArgs;
        };
    } & TArgs
> =>
    getBaseColumnOperationContext({
        TargetColumns: {
            value: [
                {
                    index: 1,
                    name: "'Some_column'",
                    key: "'\\'Some_column\\''"
                }
            ],
            subMenu: subMenuArgs
        },
        ...args
    });

export const getTwoColumnOperationContext = <TArgs, TSubMenuArgs>(
    args: TArgs,
    subMenuArgs: TSubMenuArgs = {} as any
): IDataWranglerOperationContext<
    {
        TargetColumns: {
            value: IColumnTarget[];
            subMenu: TSubMenuArgs;
        };
    } & TArgs
> =>
    getBaseColumnOperationContext({
        TargetColumns: {
            value: [
                {
                    index: 1,
                    name: "Some_column",
                    key: "'Some_column'"
                },
                {
                    index: 2,
                    name: "Another_column",
                    key: "'Another_column'"
                }
            ],
            subMenu: subMenuArgs
        },
        ...args
    });

export const getAllColumnsOperationContext = <TArgs, TSubMenuArgs>(
    args: TArgs,
    subMenuArgs: TSubMenuArgs = {} as any
): IDataWranglerOperationContext<
    {
        TargetColumns: {
            value: IColumnTarget[];
            subMenu: TSubMenuArgs;
        };
    } & TArgs
> =>
    getBaseColumnOperationContext({
        TargetColumns: {
            value: [
                {
                    index: 1,
                    name: "Some_column",
                    key: "'Some_column'"
                },
                {
                    index: 2,
                    name: "Another_column",
                    key: "'Another_column'"
                },
                {
                    index: 3,
                    name: "Yet_another_column",
                    key: "'Yet_another_column'"
                }
            ],
            subMenu: subMenuArgs
        },
        ...args
    });

const assertBaseProgram = <T>(baseProgram: T | undefined, expected: T) => {
    // make it easier to ignore undefined values
    const baseProgramWithUndefinedRemoved = { ...baseProgram } as any;
    for (const key of Object.keys(baseProgramWithUndefinedRemoved)) {
        if (baseProgramWithUndefinedRemoved[key] === undefined) {
            delete baseProgramWithUndefinedRemoved[key];
        }
    }
    assert.deepStrictEqual(baseProgramWithUndefinedRemoved, expected, "Base program did not match expected");
};

/**
 * Assert base program generation for data import operations.
 */
export const assertDataImportOperationBaseProgramGenSuccess = async <T extends IBaseProgram>(
    operation: IGenericDataImportOperation<any, T>,
    ctx: IWranglerStartSessionContext,
    expectedBaseProgram: T,
    expectedDescription: string
) => {
    const result = await operation.generateBaseProgram(ctx);

    if (result.result !== OperationCodeGenResultType.Success) {
        assert.fail("Operation was unsuccessful");
    }

    assertBaseProgram(result.getBaseProgram?.(), expectedBaseProgram);
    assert.strictEqual(result.getDescription("en"), expectedDescription);
};

/**
 * Assert base program generation for operations.
 */
export const assertOperationBaseProgramGenSuccess = async <
    TArgs extends { [key: string]: any },
    TBaseProgram extends IBaseProgram
>(
    operation: IGenericOperation<TArgs, TBaseProgram>,
    ctx: IDataWranglerOperationContext<TArgs>,
    expectedBaseProgram: TBaseProgram,
    expectedDescription: string
) => {
    const result = await operation.generateBaseProgram(ctx);

    if (result.result !== OperationCodeGenResultType.Success) {
        assert.fail("Operation was unsuccessful: " + JSON.stringify(result));
    }

    assertBaseProgram(result.getBaseProgram?.(), expectedBaseProgram);
    assert.strictEqual(result.getDescription("en"), expectedDescription, "Description did not match expected");
};

/**
 * Assert base program generation failure for operations.
 */
export const assertOperationBaseProgramGenFailure = async <
    TArgs extends { [key: string]: any },
    TBaseProgram extends IBaseProgram
>(
    operation: IGenericOperation<TArgs, TBaseProgram>,
    ctx: IDataWranglerOperationContext,
    expectedReason?: string,
    inputErrors?: { [key in keyof TArgs]?: string }
) => {
    const result = await operation.generateBaseProgram(ctx);
    assert.strictEqual(result.result, OperationCodeGenResultType.Failure);
    if (result.result === OperationCodeGenResultType.Failure) {
        assert.strictEqual(result.reason, expectedReason);
        assert.deepStrictEqual(result.inputErrors ?? {}, inputErrors ?? {});
    }
};

/**
 * Assert base program generation incomplete for operations.
 */
export const assertOperationBaseProgramGenIncomplete = async <
    TArgs extends { [key: string]: any },
    TBaseProgram extends IBaseProgram
>(
    operation: IGenericOperation<TArgs, TBaseProgram>,
    ctx: IDataWranglerOperationContext,
    inputErrors?: { [key in keyof TArgs]?: string }
) => {
    const result = await operation.generateBaseProgram(ctx);
    assert.strictEqual(result.result, OperationCodeGenResultType.Incomplete);
    if (result.result === OperationCodeGenResultType.Incomplete) {
        assert.deepStrictEqual(result.inputErrors ?? {}, inputErrors ?? {});
    }
};

/**
 * Helper to get assert on code from data import operation base programs.
 */
export const assertDataImportOperationCode = async <T extends IBaseProgram>(
    operation: IDataImportOperationWithBaseProgram<any, T>,
    baseProgram: T,
    assertions: {
        runtimeCode: string;
        displayCode?: string;
        validationResult?: {
            type: TranslationValidationResultType;
            message?: string | string[];
        };
    }
) => {
    const context = {
        originalEngineName: "pandas",
        baseProgram,
        getLocalizedStrings: () => LocalizedStrings.Orchestrator,
        formatString
    };
    const { getRuntimeCode, getDisplayCode } = await operation.generateCodeFromBaseProgram(context);
    const actualRuntimeCode = getRuntimeCode("en");
    const actualDisplayCode = getDisplayCode?.("en");

    const { runtimeCode, displayCode, validationResult } = assertions;
    assert.strictEqual(actualRuntimeCode, runtimeCode, "Runtime code did not match expected");

    // if expected display code is not provided then assume it either is not defined or it's identical to the runtime code
    if (displayCode === undefined) {
        if (getDisplayCode) {
            assert.strictEqual(actualDisplayCode, runtimeCode, "Display code did not match expected");
        } else {
            assert.strictEqual(actualDisplayCode, undefined, "Display code did not match expected");
        }
    } else {
        assert.ok(getDisplayCode, "getDisplayCode helper is undefined");
        assert.strictEqual(getDisplayCode("en"), displayCode, "Display code did not match expected");
    }

    const expectedValidation = validationResult ?? { type: TranslationValidationResultType.Success };
    const actualValidation = operation.validateBaseProgram?.(context) ?? {
        type: TranslationValidationResultType.Success
    };
    assert.strictEqual(actualValidation.type, expectedValidation.type);
    if (expectedValidation.message) {
        if (actualValidation.type === TranslationValidationResultType.Warning) {
            assert.strictEqual(actualValidation.getMessage("en"), expectedValidation.message);
        }
        if (actualValidation.type === TranslationValidationResultType.MultiWarning) {
            assert.deepStrictEqual(
                actualValidation.warnings.map((warning) => warning.getMessage("en")),
                expectedValidation.message
            );
        }
    }
};

/**
 * Helper to assert on code from operation base programs.
 */
export const assertOperationCode = async <T extends IBaseProgram>(
    operation: IOperationWithBaseProgram<any, T>,
    baseProgram: T,
    assertions: {
        code: string;
        validationResult?: {
            type: TranslationValidationResultType;
            message?: string | string[];
        };
    }
) => {
    const context = {
        originalEngineName: "pandas",
        baseProgram,
        getLocalizedStrings: () => LocalizedStrings.Orchestrator,
        formatString
    };
    const { getCode } = await operation.generateCodeFromBaseProgram(context);
    const { code, validationResult } = assertions;
    assert.strictEqual(getCode("en"), code, "Code did not match expected");

    const expectedValidation = validationResult ?? { type: TranslationValidationResultType.Success };
    const actualValidation = operation.validateBaseProgram?.(context) ?? {
        type: TranslationValidationResultType.Success
    };
    assert.strictEqual(actualValidation.type, expectedValidation.type);
    if (expectedValidation.message) {
        if (actualValidation.type === TranslationValidationResultType.Warning) {
            assert.strictEqual(actualValidation.getMessage("en"), expectedValidation.message);
        }
        if (actualValidation.type === TranslationValidationResultType.MultiWarning) {
            assert.deepStrictEqual(
                actualValidation.warnings.map((warning) => warning.getMessage("en")),
                expectedValidation.message
            );
        }
    }
};
