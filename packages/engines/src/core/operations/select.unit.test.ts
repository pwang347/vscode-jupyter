import { SelectOperationBase } from "./select";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = SelectOperationBase();

describe("[Base Program] Column operation: Select column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            "Select column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"]
            },
            "Select columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
