import { RoundDecimalsOperationBase } from "./roundDecimals";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = RoundDecimalsOperationBase();

describe("[Base Program] Column operation: Round column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                Decimals: 2
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                decimals: 2
            },
            "Round column 'Some_column' (Number of decimals: 2)"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                Decimals: 2
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                decimals: 2
            },
            "Round columns 'Some_column', 'Another_column' (Number of decimals: 2)"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
