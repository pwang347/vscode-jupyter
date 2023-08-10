import { ColumnType } from "@dw/messaging";
import { FilterCondition, JoinType } from "../../../core/operations/filter";
import Operations from "./filter";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Filter;

describe("[Pandas] Column operation: Filter", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: "df = df[df['Some_column'] == \"123\"]"
            }
        );
    });

    it("[filterCondition=NotEqual] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.NotEqual,
                    conditionValue: "123",
                    matchCase: undefined
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] != \"123\"]"
            }
        );
    });

    it("[filterCondition=GreaterThan] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.GreaterThan,
                    conditionValue: 123
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] > 123]"
            }
        );
    });

    it("[filterCondition=GreaterThanOrEqual] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.GreaterThanOrEqual,
                    conditionValue: 123
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] >= 123]"
            }
        );
    });

    it("[filterCondition=LessThan] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.LessThan,
                    conditionValue: 123
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] < 123]"
            }
        );
    });

    it("[filterCondition=LessThanOrEqual] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.LessThanOrEqual,
                    conditionValue: 123
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] <= 123]"
            }
        );
    });

    it("[filterCondition=NaN] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.NaN
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].isna()]"
            }
        );
    });

    it("[filterCondition=NotNaN] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Integer,
                    conditionType: FilterCondition.NotNaN
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].notna()]"
            }
        );
    });

    it("[filterCondition=IsTrue] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Boolean,
                    conditionType: FilterCondition.IsTrue
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] == True]"
            }
        );
    });

    it("[filterCondition=IsFalse] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Boolean,
                    conditionType: FilterCondition.IsFalse
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'] == False]"
            }
        );
    });

    it("[filterCondition=StartsWith] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.StartsWith,
                    conditionValue: "foo"
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].str.startswith(\"foo\", na=False)]"
            }
        );
    });

    it("[filterCondition=EndsWith] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.EndsWith,
                    conditionValue: "foo"
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].str.endswith(\"foo\", na=False)]"
            }
        );
    });

    it("[filterCondition=Has, matchCase=True] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.Has,
                    conditionValue: "foo",
                    matchCase: true
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].str.contains(\"foo\", na=False)]"
            }
        );
    });

    it("[filterCondition=Has, matchCase=False] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.Has,
                    conditionValue: "foo",
                    matchCase: false
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['Some_column'].str.contains(\"foo\", na=False, case=False)]"
            }
        );
    });

    it("[filterCondition=NotHas, matchCase=True] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.NotHas,
                    conditionValue: "foo",
                    matchCase: true
                },
                additionalConditions: []
            },
            {
                code: "df = df[~df['Some_column'].str.contains(\"foo\", na=False)]"
            }
        );
    });

    it("[filterCondition=NotHas, matchCase=False] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.NotHas,
                    conditionValue: "foo",
                    matchCase: false
                },
                additionalConditions: []
            },
            {
                code: "df = df[~df['Some_column'].str.contains(\"foo\", na=False, case=False)]"
            }
        );
    });

    it("should handle happy path for 1 column with datetime type", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.Datetime,
                    conditionType: FilterCondition.Equal,
                    conditionValue: "2022-06-01T22:30:29.726Z",
                    matchCase: undefined
                },
                additionalConditions: []
            },
            {
                code: [
                    "from datetime import datetime",
                    "df = df[df['Some_column'] == datetime.strptime('2022-06-01T22:30:29.726Z', '%Y-%m-%dT%H:%M:%S.%fZ')]"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 column with string type using nothas (not contains) condition matching case", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: "df = df[~df['Some_column'].str.contains(\"some_string\", na=False)]"
            }
        );
    });

    it("should handle happy path for 1 column with string type using nothas (does not contain) condition without matching case", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'Some_column'",
                    type: ColumnType.String,
                    conditionType: FilterCondition.NotHas,
                    conditionValue: "some_string",
                    matchCase: false
                },
                additionalConditions: []
            },
            {
                code: "df = df[~df['Some_column'].str.contains(\"some_string\", na=False, case=False)]"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                condition: {
                    columnKey: "'\\'Some_column\\''",
                    type: ColumnType.String,
                    conditionType: FilterCondition.Equal,
                    conditionValue: "123",
                    matchCase: undefined
                },
                additionalConditions: []
            },
            {
                code: "df = df[df['\\'Some_column\\''] == \"123\"]"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
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
                        joinType: JoinType.Or,
                        columnKey: "'Another_column'",
                        type: ColumnType.String,
                        conditionType: FilterCondition.Equal,
                        conditionValue: "456",
                        matchCase: undefined
                    }
                ]
            },
            {
                code: "df = df[(df['Some_column'] == \"123\") | (df['Another_column'] == \"456\")]"
            }
        );
    });
});
