import Operations from "./splitText";
import { assertOperationCode } from "./testUtil";

const operation = Operations.SplitText;

describe("[Pandas] Column operation: Split text in column", () => {
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
                    "import pandas as pd",
                    "loc_0 = some_df.columns.get_loc('Some_column')",
                    "some_df_split = some_df['Some_column'].str.split(expand=True).add_prefix('Some_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "some_df = some_df.drop(columns=['Some_column'])"
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
                    "import pandas as pd",
                    "loc_0 = some_df.columns.get_loc('Some_column')",
                    "some_df_split = some_df['Some_column'].str.split(pat='\\\\.\\\\*', expand=True).add_prefix('Some_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "some_df = some_df.drop(columns=['Some_column'])"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with regex (1 char)", async () => {
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
                delimiter: "."
            },
            {
                code: [
                    "import pandas as pd",
                    "import re",
                    "loc_0 = some_df.columns.get_loc('Some_column')",
                    "some_df_split = some_df['Some_column'].str.split(pat=re.compile('.'), expand=True).add_prefix('Some_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "some_df = some_df.drop(columns=['Some_column'])"
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
                    "import pandas as pd",
                    "loc_0 = some_df.columns.get_loc('Some_column')",
                    "some_df_split = some_df['Some_column'].str.split(pat='.*', expand=True).add_prefix('Some_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "some_df = some_df.drop(columns=['Some_column'])"
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
                    "import pandas as pd",
                    "loc_0 = some_df.columns.get_loc('\\'Some_column\\'')",
                    "some_df_split = some_df['\\'Some_column\\''].str.split(pat='\\' \\'', expand=True).add_prefix('\\'Some_column\\'_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "some_df = some_df.drop(columns=['\\'Some_column\\''])"
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
                    "import pandas as pd",
                    "loc_0 = some_df.columns.get_loc('Some_column')",
                    "some_df_split = some_df['Some_column'].str.split(expand=True).add_prefix('Some_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_0], some_df_split, some_df.iloc[:, loc_0:]], axis=1)",
                    "loc_1 = some_df.columns.get_loc('Another_column')",
                    "some_df_split = some_df['Another_column'].str.split(expand=True).add_prefix('Another_column_')",
                    "some_df = pd.concat([some_df.iloc[:, :loc_1], some_df_split, some_df.iloc[:, loc_1:]], axis=1)",
                    "some_df = some_df.drop(columns=['Some_column', 'Another_column'])"
                ].join("\n")
            }
        );
    });
});
