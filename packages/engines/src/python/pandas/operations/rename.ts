import { OperationKey } from "@dw/orchestrator";
import { RenameOperationBase } from "../../../core/operations/rename";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";

export default {
    [OperationKey.Rename]: extendBaseOperation(RenameOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKey, newColumnName } = ctx.baseProgram;
            const newName = escapeSingleQuote(newColumnName);
            return {
                /**
                 * Example: rename 'Survived' column to 'IsAlive'
                 * ```
                 * df = df.rename(columns={'Survived': 'IsAlive'})
                 * ```
                 */
                getCode: () => `${df} = ${df}.rename(columns={${columnKey}: '${newName}'})`
            };
        }
    })
};
