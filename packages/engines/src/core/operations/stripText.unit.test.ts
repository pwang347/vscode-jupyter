import { StripTextOperationBase, StripTextType } from "./stripText";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure
} from "./testUtil";

const operation = StripTextOperationBase();

describe("[Base Program] Column operation: Strip text", () => {
    it("should handle happy path for 1 selected column with both leading and trailing stripped", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                RemoveLeadingSpaces: true,
                RemoveTrailingSpaces: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.All
            },
            "Remove leading and trailing whitespace in column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column with leading stripped", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                RemoveLeadingSpaces: true,
                RemoveTrailingSpaces: false
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Leading
            },
            "Remove leading whitespace in column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column with trailing stripped", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                RemoveLeadingSpaces: false,
                RemoveTrailingSpaces: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                stripType: StripTextType.Trailing
            },
            "Remove trailing whitespace in column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns with trailing stripped", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                RemoveLeadingSpaces: false,
                RemoveTrailingSpaces: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                stripType: StripTextType.Trailing
            },
            "Remove trailing whitespace in columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getZeroColumnOperationContext({
                RemoveLeadingSpaces: false,
                RemoveTrailingSpaces: true
            })
        );
    });

    it("should fail when neither leading nor trailing strip selected", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({
                RemoveLeadingSpaces: false,
                RemoveTrailingSpaces: false
            }),
            undefined,
            {
                RemoveLeadingSpaces: "At least one option must be selected.",
                RemoveTrailingSpaces: "At least one option must be selected."
            }
        );
    });
});
