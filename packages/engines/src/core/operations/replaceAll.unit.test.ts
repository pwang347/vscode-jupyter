import { ColumnType } from "@dw/messaging";
import { MatchType, ReplaceAllOperationBase } from "./replaceAll";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = ReplaceAllOperationBase();

describe("[Base Program] Column operation: Replace all", () => {
    it("[matchType=default] should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    OldValue: 1,
                    OldValueOptionsByType: {},
                    NewValue: 2
                },
                { type: ColumnType.Integer, rawType: "int64" }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                match: {
                    type: MatchType.Default,
                    value: 1
                },
                newValue: 2
            },
            `Replace all instances of 1 with 2 in column: 'Some_column'`
        );
    });

    it("[matchType=string] should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    OldValue: "Value to replace",
                    OldValueOptionsByType: {},
                    NewValue: "Replacement value"
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            `Replace all instances of "Value to replace" with "Replacement value" in column: 'Some_column'`
        );
    });

    it("[matchType=string] should handle happy path for 1 selected column with options", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    OldValue: "Value to replace",
                    OldValueOptionsByType: {
                        MatchFullString: true,
                        MatchCase: true,
                        UseRegEx: true
                    },
                    NewValue: "Replacement value"
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: true,
                    matchCase: true,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            `Replace all instances of "Value to replace" with "Replacement value" in column: 'Some_column'`
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext(
                {},
                {
                    OldValue: "Value to replace",
                    OldValueOptionsByType: {
                        MatchFullString: false,
                        MatchCase: false,
                        UseRegEx: true
                    },
                    NewValue: "Replacement value"
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            `Replace all instances of "Value to replace" with "Replacement value" in columns: 'Some_column', 'Another_column'`
        );
    });

    it("should return null result when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when the old value arg is empty and new value is provided", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    OldValue: "",
                    OldValueOptionsByType: {},
                    NewValue: "foo"
                }
            ),
            undefined,
            {
                OldValue: "Old value must be non-empty."
            } as any
        );
    });

    it("should accept empty old value when match full string is provided", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    OldValue: "",
                    OldValueOptionsByType: {
                        MatchFullString: true
                    },
                    NewValue: "Replacement value"
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "",
                    matchFullString: true,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            `Replace all instances of "" with "Replacement value" in column: 'Some_column'`
        );
    });
});
