import { ConvertToCapitalCaseOperationBase } from "./convertToCapitalCase";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = ConvertToCapitalCaseOperationBase();

describe("[Base Program] Column operation: Convert to capital case", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                CapitalizeWords: false
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: false
            },
            "Convert text to capital case in column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column and capitalize words set to true", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                CapitalizeWords: true
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                capitalizeWords: true
            },
            "Convert text to capital case in column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                CapitalizeWords: false
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                capitalizeWords: false
            },
            "Convert text to capital case in columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getZeroColumnOperationContext({
                CapitalizeWords: false
            })
        );
    });
});
