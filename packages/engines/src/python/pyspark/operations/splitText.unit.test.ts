import Operations from "./splitText";
import { assertOperationCode } from "./testUtil";

const operation = Operations.SplitText;

describe("[PySpark] Column operation: Split text in column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "some_df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                useRegExp: false,
                delimiter: " "
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "split_col = F.split(some_df['Some_column'], ' ')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_0 = some_df.columns.index('Some_column')",
                    "for i in range(max_size):",
                    "    cur_col_name = 'Some_column_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with literal string", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "some_df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                useRegExp: false,
                delimiter: ".*"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "split_col = F.split(some_df['Some_column'], '\\\\.\\\\*')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_0 = some_df.columns.index('Some_column')",
                    "for i in range(max_size):",
                    "    cur_col_name = 'Some_column_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with regex", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "some_df",
                columns: [
                    {
                        key: "'Some_column'",
                        name: "Some_column",
                        index: 1
                    }
                ],
                useRegExp: true,
                delimiter: ".*"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "split_col = F.split(some_df['Some_column'], '.*')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_0 = some_df.columns.index('Some_column')",
                    "for i in range(max_size):",
                    "    cur_col_name = 'Some_column_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column name and delimiter", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "some_df",
                columns: [
                    {
                        key: "'\\'Some_column\\''",
                        name: "'Some_column'",
                        index: 1
                    }
                ],
                useRegExp: false,
                delimiter: "' '"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "split_col = F.split(some_df['\\'Some_column\\''], '\\' \\'')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_0 = some_df.columns.index('\\'Some_column\\'')",
                    "for i in range(max_size):",
                    "    cur_col_name = '\\'Some_column\\'_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "some_df",
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
                delimiter: " "
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "split_col = F.split(some_df['Some_column'], ' ')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_0 = some_df.columns.index('Some_column')",
                    "for i in range(max_size):",
                    "    cur_col_name = 'Some_column_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_0], *new_cols, *old_cols[loc_0+1:])",
                    "split_col = F.split(some_df['Another_column'], ' ')",
                    "max_size = some_df.select(F.max(F.size(split_col))).collect()[0][0]",
                    "old_cols = some_df.columns",
                    "new_cols = []",
                    "loc_1 = some_df.columns.index('Another_column')",
                    "for i in range(max_size):",
                    "    cur_col_name = 'Another_column_%d' % i",
                    "    new_cols.append(cur_col_name)",
                    "    some_df = some_df.withColumn(cur_col_name, split_col.getItem(i))",
                    "some_df = some_df.select(*old_cols[:loc_1], *new_cols, *old_cols[loc_1+1:])"
                ].join("\n")
            }
        );
    });
});
