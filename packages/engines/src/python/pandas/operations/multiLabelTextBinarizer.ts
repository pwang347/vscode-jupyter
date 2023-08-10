import { OperationKey } from "@dw/orchestrator";
import { MultiLabelTextBinarizerOperationBase } from "../../../core/operations/multiLabelTextBinarizer";
import { extendBaseOperation } from "../../../core/translate";
import { escapeSingleQuote } from "../../../core/operations/util";

export default {
    [OperationKey.MultiLabelTextBinarizer]: extendBaseOperation(MultiLabelTextBinarizerOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columns, delimiter, prefix } = ctx.baseProgram;
            const delimiterEscaped = `'${escapeSingleQuote(delimiter)}'`;
            const multiLabelTextBinarizerStatements = columns
                .map((col, idx) => {
                    const key = col.key;
                    const delimiter = `sep=${delimiterEscaped}`;
                    const prefixValue = prefix
                        ? `'${escapeSingleQuote(prefix)}_'`
                        : `'${escapeSingleQuote(col.name)}_'`;
                    return [
                        `loc_${idx} = ${df}.columns.get_loc(${key})`,
                        `${df}_encoded = ${df}[${key}].str.get_dummies(${delimiter}).add_prefix(${prefixValue})`,
                        `${df} = pd.concat([${df}.iloc[:,:loc_${idx}], ${df}_encoded, ${df}.iloc[:,loc_${idx}+1:]], axis=1)`
                    ].join("\n");
                })
                .join("\n");

            return {
                /**
                 * Example: multi-label encode the 'Embarked' column using delimiter ';'
                 * ```
                 * import pandas as pd
                 * loc_0 = df.columns.get_loc('Embarked')
                 * df_encoded = df['Embarked'].str.get_dummies(sep=';').add_prefix('Embarked_')
                 * df = pd.concat([df.iloc[:,:loc_0], df_encoded, df.iloc[:,loc_0+1:]], axis=1)
                 * ```
                 */
                getCode: () => ["import pandas as pd", multiLabelTextBinarizerStatements].join("\n")
            };
        }
    })
};
