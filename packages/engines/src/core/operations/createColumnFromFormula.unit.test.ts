import { codeHasLambda } from "../../python/util";
import { CreateColumnFromFormulaOperationBase } from "./createColumnFromFormula";
import {
    getZeroColumnOperationContext,
    assertOperationBaseProgramGenSuccess,
    assertOperationBaseProgramGenIncomplete
} from "./testUtil";

const operation = CreateColumnFromFormulaOperationBase({
    hasLambda: codeHasLambda,
    examples: []
});

describe("[Base Program] Create column from formula", () => {
    it("should handle happy path", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getZeroColumnOperationContext({
                ColumnName: "Some_new_column",
                Formula: "1"
            }),
            {
                variableName: "df",
                columnFormula: "1",
                columnName: "Some_new_column",
                isExistingColumn: false
            },
            "Created column 'Some_new_column' from formula"
        );
    });

    it("should automatically generate a column name", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getZeroColumnOperationContext({
                ColumnName: "",
                Formula: "1"
            }),
            {
                variableName: "df",
                columnFormula: "1",
                columnName: "newCol",
                isExistingColumn: false
            },
            "Created column 'newCol' from formula"
        );
    });

    it("should handle happy path for replacing an existing column", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getZeroColumnOperationContext({
                ColumnName: "Some_column",
                Formula: "1"
            }),
            {
                variableName: "df",
                columnFormula: "1",
                columnName: "Some_column",
                isExistingColumn: true
            },
            "Modified column 'Some_column' using formula"
        );
    });

    it("should return incomplete if formula is unset", async () => {
        await assertOperationBaseProgramGenIncomplete(
            operation,
            getZeroColumnOperationContext({
                ColumnName: "Some_column",
                Formula: ""
            })
        );
    });
});
