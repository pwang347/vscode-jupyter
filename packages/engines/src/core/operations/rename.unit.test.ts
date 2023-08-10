import { RenameOperationBase } from "./rename";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = RenameOperationBase();

describe("[Base Program] Column operation: Rename column", () => {
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
            "Rename column 'Some_column' to 'New_column_name'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should return incomplete when the name is the same as before", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getOneColumnOperationContext({
                NewColumnName: "Some_column"
            })
        );
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
