import { ColumnType } from "@dw/messaging";
import { CastableType, ChangeTypeOperationBase } from "./changeType";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete,
    assertOperationBaseProgramGenFailure,
    getTwoColumnOperationContext
} from "./testUtil";

const operation = ChangeTypeOperationBase({
    getCastableRawTypes: (): Array<CastableType> => {
        return [
            {
                label: "test_int64",
                type: ColumnType.Integer,
                metadata: {
                    unsigned: false,
                    bits: 64
                }
            },
            {
                label: "test_bool",
                type: ColumnType.Boolean,
                metadata: {}
            }
        ];
    }
});

describe("Column operation: Change column type", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                TargetType: {
                    value: "test_int64"
                }
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                targetType: {
                    label: "test_int64",
                    type: ColumnType.Integer,
                    metadata: {
                        unsigned: false,
                        bits: 64
                    }
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            "Change column type to test_int64 for column: 'Some_column'"
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getTwoColumnOperationContext({
                TargetType: {
                    value: "test_bool"
                }
            }),
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                targetType: {
                    label: "test_bool",
                    type: ColumnType.Boolean,
                    metadata: {}
                },
                dependencies: {
                    satisfied: {},
                    unsatisfied: {}
                }
            },
            "Change column type to test_bool for columns: 'Some_column', 'Another_column'"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });

    it("should fail when TargetType isn't a supported type", async () => {
        await assertOperationBaseProgramGenFailure(
            operation,
            getOneColumnOperationContext({
                TargetType: {
                    value: "test_nonexistent"
                }
            }),
            "An unknown error occurred."
        );
    });
});
