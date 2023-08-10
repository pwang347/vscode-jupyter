import { ColumnType } from "@dw/messaging";
import { FillMethod } from "../../../core/operations/fillNa";
import Operations from "./fillNa";
import { assertOperationCode } from "./testUtil";

const operation = Operations.FillNa;

describe("[Pandas] Column operation: Fill missing values", () => {
    it("[method=mean] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].mean()})"
            }
        );
    });

    it("[method=median] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Median
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].median()})"
            }
        );
    });

    it("[method=mode] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Mode
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].mode()[0]})"
            }
        );
    });

    it("[method=bfill] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Bfill
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].bfill()})"
            }
        );
    });

    it("[method=ffill] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Ffill
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].ffill()})"
            }
        );
    });

    it("[method=custom] should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                type: ColumnType.Integer,
                fill: {
                    method: FillMethod.Custom,
                    parameter: 3
                }
            },
            {
                code: "df = df.fillna({'Some_column': 3})"
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
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: "df = df.fillna({'\\'Some_column\\'': df['\\'Some_column\\''].mean()})"
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
                fill: {
                    method: FillMethod.Mean
                }
            },
            {
                code: "df = df.fillna({'Some_column': df['Some_column'].mean(), 'Another_column': df['Another_column'].mean()})"
            }
        );
    });
});
