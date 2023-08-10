import { ColumnType } from "@dw/messaging";
import { MatchType } from "../../../core/operations/replaceAll";
import { PandasDTypes } from "../types";
import Operations from "./replaceAll";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ReplaceAll;

describe("[Pandas] Column operation: Replace all", () => {
    it("[matchType=default] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                match: {
                    type: MatchType.Default,
                    value: 1
                },
                newValue: 2
            },
            {
                code: "df.loc[df['Some_column'] == 1, 'Some_column'] = 2"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: false, MatchCase: false, and UseRegex: false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.replace(\"Value to replace\", \"Replacement value\", case=False, regex=False)"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: false, MatchCase: false, and UseRegex: true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.replace(\"Value to replace\", \"Replacement value\", case=False, regex=True)"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: false, MatchCase: true, and UseRegex: false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: true,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.replace(\"Value to replace\", \"Replacement value\", regex=False)"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: false, MatchCase: true, and UseRegex: true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: false,
                    matchCase: true,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: "df['Some_column'] = df['Some_column'].str.replace(\"Value to replace\", \"Replacement value\", regex=True)"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: true, MatchCase: false, and UseRegex: false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: true,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                // Note that here we are using .loc instead of .str.replace because we are matching the full string
                // We are using .lower() on both sides of the equation to make the match case insensitive
                code: "df.loc[df['Some_column'].str.lower() == \"Value to replace\".lower(), 'Some_column'] = \"Replacement value\""
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: true, MatchCase: false, and UseRegex: true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: true,
                    matchCase: false,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                // Note that we append ^ and $ around the user-provided regex to match the full string
                code: "df['Some_column'] = df['Some_column'].str.replace(\"^Value to replace$\", \"Replacement value\", case=False, regex=True)"
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: true, MatchCase: true, and UseRegex: false", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: true,
                    matchCase: true,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                // Note that here we are using .loc instead of .str.replace because we are matching the full string
                code: "df.loc[df['Some_column'] == \"Value to replace\", 'Some_column'] = \"Replacement value\""
            }
        );
    });

    it("should handle happy path for 1 selected column with MatchFullString: true, MatchCase: true, and UseRegex: true", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.String,
                match: {
                    type: MatchType.String,
                    value: "Value to replace",
                    matchFullString: true,
                    matchCase: true,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                // Note that we append ^ and $ around the user-provided regex to match the full string
                code: "df['Some_column'] = df['Some_column'].str.replace(\"^Value to replace$\", \"Replacement value\", regex=True)"
            }
        );
    });

    it("should handle happy path for 1 selected column with datetime type", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Datetime,
                match: {
                    type: MatchType.Default,
                    value: "2022-06-01T22:30:29.726Z"
                },
                newValue: "2022-06-03T22:35:22.726Z"
            },
            {
                code: [
                    "from datetime import datetime",
                    "df.loc[df['Some_column'] == datetime.strptime('2022-06-01T22:30:29.726Z', '%Y-%m-%dT%H:%M:%S.%fZ'), 'Some_column'] = datetime.strptime('2022-06-03T22:35:22.726Z', '%Y-%m-%dT%H:%M:%S.%fZ')"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                type: ColumnType.Integer,
                match: {
                    type: MatchType.Default,
                    value: 1
                },
                newValue: 2
            },
            {
                code: "df.loc[df['\\'Some_column\\''] == 1, '\\'Some_column\\''] = 2"
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                type: ColumnType.Integer,
                match: {
                    type: MatchType.Default,
                    value: 1
                },
                newValue: 2
            },
            {
                code: [
                    "df.loc[df['Some_column'] == 1, 'Some_column'] = 2",
                    "df.loc[df['Another_column'] == 1, 'Another_column'] = 2"
                ].join("\n")
            }
        );
    });
});
