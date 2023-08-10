import { ScaleOperationBase } from "./scale";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = ScaleOperationBase();

describe("[Base Program] Column operation: Scale column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({ NewMaximum: 1, NewMinimum: 0 }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            "Scale column 'Some_column' between 0 and 1"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({ NewMaximum: 1, NewMinimum: 0 }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            "Scale columns 'Some_column', 'Another_column' between 0 and 1"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getZeroColumnOperationContext({ NewMaximum: 1, NewMinimum: 0 })
        );
    });

    it("should fail when min == max", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({ NewMaximum: 1, NewMinimum: 1 }),
            undefined,
            {
                NewMinimum: "Minimum value must be smaller than maximum value."
            }
        );
    });

    it("should fail when min > max", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({ NewMaximum: 1, NewMinimum: 2 }),
            undefined,
            {
                NewMinimum: "Minimum value must be smaller than maximum value."
            }
        );
    });
});
