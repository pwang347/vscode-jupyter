import { SortOperationBase, SortOrder } from "./sort";
import {
    getOneColumnOperationContext,
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = SortOperationBase();

describe("[Base Program] Column operation: Sort column", () => {
    it("should handle happy path for 1 column (ascending)", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                MissingValuesFirst: false,
                SortOrder: {
                    value: SortOrder.Ascending
                },
                AdditionalSortColumns: {
                    children: []
                }
            }),
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: SortOrder.Ascending
                    }
                ],
                missingValuesFirst: false
            },
            "Sort by column: 'Some_column' (ascending)"
        );
    });

    it("should handle happy path for 1 column (descending)", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                MissingValuesFirst: false,
                SortOrder: {
                    value: SortOrder.Descending
                },
                AdditionalSortColumns: {
                    children: []
                }
            }),
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: "descending"
                    }
                ],
                missingValuesFirst: false
            },
            "Sort by column: 'Some_column' (descending)"
        );
    });

    it("should handle happy path for 1 column (descending), missing values first", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                MissingValuesFirst: true,
                SortOrder: {
                    value: SortOrder.Descending
                },
                AdditionalSortColumns: {
                    children: []
                }
            }),
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: "descending"
                    }
                ],
                missingValuesFirst: true
            },
            "Sort by column: 'Some_column' (descending)"
        );
    });

    it("should handle happy path for 2 columns", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getOneColumnOperationContext({
                MissingValuesFirst: true,
                SortOrder: {
                    value: SortOrder.Ascending
                },
                AdditionalSortColumns: {
                    children: [
                        {
                            TargetColumns: {
                                value: [
                                    {
                                        name: "Another_column",
                                        key: "'Another_column'",
                                        index: 2
                                    }
                                ]
                            },
                            SortOrder: {
                                value: SortOrder.Descending
                            }
                        }
                    ]
                }
            }),
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: SortOrder.Ascending
                    },
                    {
                        columnKey: "'Another_column'",
                        sort: SortOrder.Descending
                    }
                ],
                missingValuesFirst: true
            },
            "Sort by columns: 'Some_column' (ascending), 'Another_column' (descending)"
        );
    });

    it("should fail when no columns selected", async () => {
        await assertOperationBaseProgramGenIncomplete(operation, getZeroColumnOperationContext({}));
    });
});
