import { OperationKey } from "@dw/orchestrator";
import { SortOperationBase, SortOrder } from "../../../core/operations/sort";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";

export default {
    [OperationKey.Sort]: extendBaseOperation(SortOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeysSort, missingValuesFirst } = ctx.baseProgram;
            const ascendingFlags = columnKeysSort.map((col) => col.sort === SortOrder.Ascending);
            return {
                /**
                 * Example: Sort by 'Age' column in ascending order, then by 'Name' in descending order, with empty values first
                 * ```
                 * df = df.sort_values(['Age', 'Name'], ascending=[True, False], na_position='first')
                 * ```
                 */
                getCode: () =>
                    `${df} = ${df}.sort_values([${columnKeysSort.map((col) => col.columnKey).join(", ")}]${
                        ascendingFlags.every((a) => a === true)
                            ? ""
                            : `, ascending=[${ascendingFlags
                                  .map((flag) => toPythonValueString(flag).value)
                                  .join(", ")}]`
                    }${missingValuesFirst ? ", na_position='first'" : ""})`
            };
        }
    })
};
