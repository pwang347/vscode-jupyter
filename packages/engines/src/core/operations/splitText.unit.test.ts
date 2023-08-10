import { SplitTextOperationBase } from "./splitText";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = SplitTextOperationBase();

describe("[Base Program] Column operation: Split text in column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                RegularExpression: false,
                Delimiter: ";"
            }),
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                useRegExp: false,
                delimiter: ";"
            },
            "Split text using string ';' in column: 'Some_column'"
        );
    });

    it("should handle happy path for 1 selected column with regex", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                RegularExpression: true,
                Delimiter: ";"
            }),
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                useRegExp: true,
                delimiter: ";"
            },
            "Split text using regex ';' in column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                RegularExpression: false,
                Delimiter: ";"
            }),
            {
                variableName: "df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    },
                    {
                        key: "'Another_column'",
                        name: "Another_column",
                        index: 2
                    }
                ],
                useRegExp: false,
                delimiter: ";"
            },
            "Split text using string ';' in columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when delimiter is empty", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getOneColumnOperationContext({
                RegularExpression: false,
                Delimiter: ""
            })
        );
    });
});
