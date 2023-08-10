import Operations from "./createColumnFromFormula";
import { assertOperationCode } from "./testUtil";

const operation = Operations.CreateColumnFromFormula;

describe("[PySpark] Create column from formula", () => {
    it("should handle happy path", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnFormula: "lit(1)",
                columnName: "Some_new_column",
                isExistingColumn: true
            },
            {
                code: "df = df.withColumn('Some_new_column', lit(1))"
            }
        );
    });

    it("should handle happy path with single quote in column name", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnFormula: "lit(1)",
                columnName: "'Some_new_column'",
                isExistingColumn: true
            },
            {
                code: "df = df.withColumn('\\'Some_new_column\\'', lit(1))"
            }
        );
    });
});
