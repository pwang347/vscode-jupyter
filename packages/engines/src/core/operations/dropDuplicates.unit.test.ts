import { DropDuplicatesOperationBase } from "./dropDuplicates";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    getAllColumnsOperationContext
} from "./testUtil";

const operation = DropDuplicatesOperationBase();

describe("[Base Program] Column operation: Drop duplicates", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetingAllColumns: false
            },
            "Drop duplicate rows in column: 'Some_column'"
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
            "Drop duplicate rows in columns: 'Some_column', 'Another_column'"
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
            "Drop duplicate rows across all columns"
        );
    });

    it("should return null result when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
