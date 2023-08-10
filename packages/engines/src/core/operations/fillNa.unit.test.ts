import { ColumnType } from "@dw/messaging";
import { FillMethod, FillNaOperationBase } from "./fillNa";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = FillNaOperationBase();

describe("[Base Program] Column operation: Fill missing values", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    Typed: {
                        SelectFillMethod: {
                            value: FillMethod.Mode,
                            subMenu: {}
                        }
                    }
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                fill: {
                    method: FillMethod.Mode,
                    parameter: undefined
                }
            },
            "Replace missing values with the most common value of each column in: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column with a custom value", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    Typed: {
                        SelectFillMethod: {
                            value: FillMethod.Custom,
                            subMenu: {
                                Value: "foo"
                            }
                        }
                    }
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                fill: {
                    method: FillMethod.Custom,
                    parameter: "foo"
                }
            },
            "Replace missing values with \"foo\" in column: 'Some_column'"
        );
    });

    it("[numeric] should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext(
                {},
                {
                    Typed: {
                        SelectFillMethod: {
                            value: FillMethod.Mode,
                            subMenu: {}
                        }
                    }
                },
                {
                    type: ColumnType.Integer,
                    rawType: "int64"
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mode,
                    parameter: undefined
                }
            },
            "Replace missing values with the mode of each column in: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext(
                {},
                {
                    Typed: {
                        SelectFillMethod: {
                            value: FillMethod.Mode,
                            subMenu: {}
                        }
                    }
                }
            ),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                type: ColumnType.String,
                fill: {
                    method: FillMethod.Mode,
                    parameter: undefined
                }
            },
            "Replace missing values with the most common value of each column in: 'Some_column', 'Another_column'"
        );
    });

    it("should return null result when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
