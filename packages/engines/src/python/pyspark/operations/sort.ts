import { OperationKey } from "@dw/orchestrator";
import { SortOperationBase, SortOrder } from "../../../core/operations/sort";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.Sort]: extendBaseOperation(SortOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeysSort, missingValuesFirst } = ctx.baseProgram;
            return {
                /**
                 * Example: Sort by 'Age' column in ascending order, then by 'Name' in descending order, with empty values first
                 * ```
                 * df = df.sort(df['Age'].asc_nulls_first(), df['Name'].desc_nulls_first())
                 * ```
                 */
                getCode: () =>
                    `${df} = ${df}.sort(${columnKeysSort
                        .map(
                            (col) =>
                                `${df}[${col.columnKey}].${
                                    missingValuesFirst
                                        ? col.sort === SortOrder.Ascending
                                            ? "asc_nulls_first()"
                                            : "desc_nulls_first()"
                                        : col.sort === SortOrder.Ascending
                                        ? "asc()"
                                        : "desc()"
                                }`
                        )
                        .join(", ")})`
            };
        }
    })
};
