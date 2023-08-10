import { CalculateTextLengthOperationBase } from "./calculateTextLength";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = CalculateTextLengthOperationBase();

describe("[Base Program] Column operation: Calculate text length for column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                NewColumnName: "New_column_name"
            }),
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnInsertIndex: 1,
                newColumnName: "New_column_name"
            },
            "Calculated text length from column: 'Some_column'"
        );
    });

    it("should generate a custom name when the name is empty", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                NewColumnName: ""
            }),
            {
                variableName: "df",
                columnKey: "'Some_column'",
                newColumnInsertIndex: 1,
                newColumnName: "Some_column_len"
            },
            "Calculated text length from column: 'Some_column'"
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
