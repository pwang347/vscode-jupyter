import { DropNaOperationBase } from "./dropNa";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    getAllColumnsOperationContext
} from "./testUtil";

const operation = DropNaOperationBase();

describe("[Base Program] Column operation: Drop missing values", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetingAllColumns: false
            },
            "Drop rows with missing data in column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                targetingAllColumns: false
            },
            "Drop rows with missing data in columns: 'Some_column', 'Another_column'"
        );
    });

    it("should handle happy path for all selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getAllColumnsOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'", "'Yet_another_column'"],
                targetingAllColumns: true
            },
            "Drop rows with missing data across all columns"
        );
    });

    it("should return null result when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
