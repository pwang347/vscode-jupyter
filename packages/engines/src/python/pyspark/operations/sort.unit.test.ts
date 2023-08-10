import Operations from "./sort";
import { SortOrder } from "../../../core/operations/sort";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Sort;

describe("[PySpark] Column operation: Sort column", () => {
    it("should handle happy path for 1 selected column (ascending)", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: "df = df.sort(df['Some_column'].asc())"
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names (ascending)", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'\\'Some_column\\''",
                        sort: SortOrder.Ascending
                    }
                ],
                missingValuesFirst: false
            },
            {
                code: "df = df.sort(df['\\'Some_column\\''].asc())"
            }
        );
    });

    it("should handle happy path for 1 selected column (descending)", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: SortOrder.Descending
                    }
                ],
                missingValuesFirst: false
            },
            {
                code: "df = df.sort(df['Some_column'].desc())"
            }
        );
    });

    it("should handle happy path for 1 column (descending), missing values first", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeysSort: [
                    {
                        columnKey: "'Some_column'",
                        sort: SortOrder.Descending
                    }
                ],
                missingValuesFirst: true
            },
            {
                code: "df = df.sort(df['Some_column'].desc_nulls_first())"
            }
        );
    });

    it("should handle happy path for 2 selected columns, missing values first", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: "df = df.sort(df['Some_column'].asc_nulls_first(), df['Another_column'].desc_nulls_first())"
            }
        );
    });
});
