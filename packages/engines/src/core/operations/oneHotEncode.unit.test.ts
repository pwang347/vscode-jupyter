import { OneHotEncodeOperationBase } from "./oneHotEncode";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = OneHotEncodeOperationBase();

describe("[Base Program] Column operation: One-hot encode", () => {
    it("[encodeMissingValues=false] should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                EncodeMissingValues: false
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: false
            },
            "One-hot encode column: 'Some_column'"
        );
    });

    it("[encodeMissingValues=true] should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                EncodeMissingValues: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                encodeMissingValues: true
            },
            "One-hot encode column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                EncodeMissingValues: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                encodeMissingValues: true
            },
            "One-hot encode columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
