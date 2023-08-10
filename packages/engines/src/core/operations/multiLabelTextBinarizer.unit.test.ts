import { MultiLabelTextBinarizerOperationBase } from "./multiLabelTextBinarizer";
import {
    getOneColumnOperationContext,
    getTwoColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = MultiLabelTextBinarizerOperationBase();

describe("[Base Program] Column operation: Multi-label text binarizer", () => {
    it("should handle happy path for 1 selected column with delimiter", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                Delimiter: ";",
                Prefix: ""
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
                delimiter: ";",
                prefix: ""
            },
            "Multi-label encode column 'Some_column' using delimiter ';'"
        );
    });

    it("should handle happy path for 1 selected column with delimiter and prefix", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                Delimiter: ";",
                Prefix: "Foo"
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
                delimiter: ";",
                prefix: "Foo"
            },
            "Multi-label encode column 'Some_column' using delimiter ';'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                Delimiter: ";",
                Prefix: ""
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
                delimiter: ";",
                prefix: ""
            },
            "Multi-label encode columns 'Some_column', 'Another_column' using delimiter ';'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should return incomplete when no delimiter provided", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getOneColumnOperationContext({
                Delimiter: "",
                Prefix: "Foo"
            })
        );
    });
});
