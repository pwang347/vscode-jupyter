import { ColumnType } from "@dw/messaging";
import { MatchType } from "../../../core/operations/replaceAll";
import { PySparkDTypes } from "../types";
import Operations from "./replaceAll";
import { assertOperationCode } from "./testUtil";

const operation = Operations.ReplaceAll;

describe("[PySpark] Column operation: Replace all", () => {
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
                code: "df = df.replace(1, value=2, subset=['Some_column'])"
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
                    value: "Value to replace?",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"(?i)Value to replace\\\\?\", \"Replacement value\"))"
                ].join("\n")
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
                    value: "Value to replace?",
                    matchFullString: false,
                    matchCase: false,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"(?i)Value to replace?\", \"Replacement value\"))"
                ].join("\n")
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
                    value: "Value to replace?",
                    matchFullString: false,
                    matchCase: true,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"Value to replace\\\\?\", \"Replacement value\"))"
                ].join("\n")
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
                    value: "Value to replace?",
                    matchFullString: false,
                    matchCase: true,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"Value to replace?\", \"Replacement value\"))"
                ].join("\n")
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
                    value: "Value to replace?",
                    matchFullString: true,
                    matchCase: false,
                    useRegEx: false
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"(?i)^Value to replace\\\\?$\", \"Replacement value\"))"
                ].join("\n")
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
                    value: "Value to replace?",
                    matchFullString: true,
                    matchCase: false,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"(?i)^Value to replace?$\", \"Replacement value\"))"
                ].join("\n")
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
                code: 'df = df.replace("Value to replace", value="Replacement value", subset=[\'Some_column\'])'
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
                    value: "Value to replace?",
                    matchFullString: true,
                    matchCase: true,
                    useRegEx: true
                },
                newValue: "Replacement value"
            },
            {
                code: [
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column', F.regexp_replace('Some_column', \"^Value to replace?$\", \"Replacement value\"))"
                ].join("\n")
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
                    "df = df.replace(datetime.strptime('2022-06-01T22:30:29.726Z', '%Y-%m-%dT%H:%M:%S.%fZ'), value=datetime.strptime('2022-06-03T22:35:22.726Z', '%Y-%m-%dT%H:%M:%S.%fZ'), subset=['Some_column'])"
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
                code: "df = df.replace(1, value=2, subset=['\\'Some_column\\''])"
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
                code: ["df = df.replace(1, value=2, subset=['Some_column', 'Another_column'])"].join("\n")
            }
        );
    });
});
