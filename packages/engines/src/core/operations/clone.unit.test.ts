import { CloneOperationBase } from "./clone";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = CloneOperationBase();

describe("[Base Program] Column operation: Clone column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                NewColumnName: "New_column_name"
            }),
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnName: "New_column_name"
            },
            "Clone column 'Some_column' as 'New_column_name'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when new column name already exists", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({ NewColumnName: "Another_column" }),
            undefined,
            {
                NewColumnName: "Column 'Another_column' already exists. Please choose a different name."
            }
        );
    });
});
