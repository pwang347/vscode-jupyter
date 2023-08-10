import assert from "assert";
import { FlashFillOperationBase } from "./flashFill";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";
import { WranglerEngineIdentifier } from "../../types";

const operation = FlashFillOperationBase({});

describe("[Base Program] Column operation: Drop column", () => {
    it("should handle happy path for 1 selected column and no examples", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                DerivedColumnName: "Some_column_derived"
            }),
            {
                variableName: "df",
                insertIndex: 1,
                newColumnName: "Some_column_derived"
            },
            "Derive column 'Some_column_derived' from column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns and no examples", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                DerivedColumnName: "Another_column_derived"
            }),
            {
                variableName: "df",
                insertIndex: 2,
                newColumnName: "Another_column_derived"
            },
            "Derive column 'Another_column_derived' from columns: 'Some_column', 'Another_column'"
        );
    });

    it("should handle happy path for 1 selected column and some examples", async () => {
        let derivedColumnWasCalled = false;
        await assertOperationBaseProgramGenSuccess(
            operation,
            {
                ...getOneColumnOperationContext({
                    DerivedColumnName: "Some_column_derived"
                }),
                gridCellEdits: [
                    {
                        value: "foos",
                        row: 0,
                        column: 1,
                        rowData: {
                            data: [0, "foo"],
                            index: 0
                        }
                    }
                ],
                proseApiClient: {
                    deriveColumn: async () => {
                        derivedColumnWasCalled = true;
                        return {
                            success: true,
                            derivedProgram: "foo",
                            derivedPrograms: {
                                Pandas: "foo",
                                PySpark: "bar"
                            },
                            significantInputs: [],
                            columnsUsed: ["Some_column"]
                        };
                    }
                }
            },
            {
                variableName: "df",
                insertIndex: 1,
                newColumnName: "Some_column_derived",
                derivedCode: {
                    [WranglerEngineIdentifier.Pandas]: "foo",
                    [WranglerEngineIdentifier.PySpark]: "bar"
                }
            },
            "Derive column 'Some_column_derived' from column: 'Some_column'"
        );
        assert.strictEqual(derivedColumnWasCalled, true);
    });

    it("should handle happy path for 2 selected columns and some examples", async () => {
        let derivedColumnWasCalled = false;
        await assertOperationBaseProgramGenSuccess(
            operation,
            {
                ...getTwoColumnOperationContext({
                    DerivedColumnName: "Another_column_derived"
                }),
                gridCellEdits: [
                    {
                        value: "foo_0",
                        row: 0,
                        column: 1,
                        rowData: {
                            data: [0, "foo", "0", "a"],
                            index: 0
                        }
                    }
                ],
                proseApiClient: {
                    deriveColumn: async () => {
                        derivedColumnWasCalled = true;
                        return {
                            success: true,
                            derivedProgram: "foo",
                            derivedPrograms: {
                                Pandas: "foo",
                                PySpark: "bar"
                            },
                            significantInputs: [],
                            columnsUsed: ["Some_column", "Another_column"]
                        };
                    }
                }
            },
            {
                variableName: "df",
                insertIndex: 2,
                newColumnName: "Another_column_derived",
                derivedCode: {
                    [WranglerEngineIdentifier.Pandas]: "foo",
                    [WranglerEngineIdentifier.PySpark]: "bar"
                }
            },
            "Derive column 'Another_column_derived' from columns: 'Some_column', 'Another_column'"
        );
        assert.strictEqual(derivedColumnWasCalled, true);
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when column name already exists", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({
                DerivedColumnName: "Some_column"
            }),
            undefined,
            {
                DerivedColumnName: "Column 'Some_column' already exists. Please choose a different name."
            }
        );
    });
});
