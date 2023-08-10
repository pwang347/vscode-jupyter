import Operations from "./multiLabelTextBinarizer";
import { assertOperationCode } from "./testUtil";

const operation = Operations.MultiLabelTextBinarizer;

describe("[Pandas] Column operation: Column operation: Multi-label text binarizer", () => {
    it("should handle happy path for 1 selected column with delimiter", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: [
                    "import pandas as pd",
                    "loc_0 = df.columns.get_loc('Some_column')",
                    "df_encoded = df['Some_column'].str.get_dummies(sep=';').add_prefix('Some_column_')",
                    "df = pd.concat([df.iloc[:,:loc_0], df_encoded, df.iloc[:,loc_0+1:]], axis=1)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with delimiter and prefix", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: [
                    "import pandas as pd",
                    "loc_0 = df.columns.get_loc('Some_column')",
                    "df_encoded = df['Some_column'].str.get_dummies(sep=';').add_prefix('Foo_')",
                    "df = pd.concat([df.iloc[:,:loc_0], df_encoded, df.iloc[:,loc_0+1:]], axis=1)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with delimiter with single quote in delimiter and column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columns: [
                    {
                        key: "'\\'Some_column\\''",
                        name: "'Some_column'",
                        index: 1
                    }
                ],
                delimiter: "';'",
                prefix: ""
            },
            {
                code: [
                    "import pandas as pd",
                    "loc_0 = df.columns.get_loc('\\'Some_column\\'')",
                    "df_encoded = df['\\'Some_column\\''].str.get_dummies(sep='\\';\\'').add_prefix('\\'Some_column\\'_')",
                    "df = pd.concat([df.iloc[:,:loc_0], df_encoded, df.iloc[:,loc_0+1:]], axis=1)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
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
            {
                code: [
                    "import pandas as pd",
                    "loc_0 = df.columns.get_loc('Some_column')",
                    "df_encoded = df['Some_column'].str.get_dummies(sep=';').add_prefix('Some_column_')",
                    "df = pd.concat([df.iloc[:,:loc_0], df_encoded, df.iloc[:,loc_0+1:]], axis=1)",
                    "loc_1 = df.columns.get_loc('Another_column')",
                    "df_encoded = df['Another_column'].str.get_dummies(sep=';').add_prefix('Another_column_')",
                    "df = pd.concat([df.iloc[:,:loc_1], df_encoded, df.iloc[:,loc_1+1:]], axis=1)"
                ].join("\n")
            }
        );
    });
});
