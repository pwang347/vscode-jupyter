import { RoundUpOperationBase } from "./roundUp";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = RoundUpOperationBase();

describe("[Base Program] Column operation: Round up column (ceil)", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({}),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"]
            },
            "Round up column 'Some_column'"
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
            "Round up columns 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
