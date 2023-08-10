import { OperationKey } from "@dw/orchestrator";
import { SplitTextOperationBase } from "../../../core/operations/splitText";
import { extendBaseOperation } from "../../../core/translate";
import { escapeRegExp, escapeSingleQuote } from "../../../core/operations/util";

export default {
    [OperationKey.SplitText]: extendBaseOperation(SplitTextOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columns, useRegExp, delimiter } = ctx.baseProgram;
            // TODO@DW: the explicit regex flag does not exist until pandas v1.4.0
            // we may want to support the alternative syntax with versioned operations for more expressiveness
            let pattern;
            if (useRegExp) {
                pattern =
                    delimiter.length > 1 ? `'${escapeSingleQuote(delimiter)}'` : `'${escapeSingleQuote(delimiter)}'`;
            } else {
                pattern =
                    delimiter.length > 1
                        ? `'${escapeSingleQuote(escapeRegExp(delimiter))}'`
                        : `'${escapeSingleQuote(delimiter)}'`;
            }

            let imports = "import pandas as pd";

            // the default behaviour is that single character patterns are literals and everything else is a regexp
            // see https://github.com/pandas-dev/pandas/issues/43563, so we force it to be regexp in this case
            if (useRegExp && delimiter.length === 1 && escapeRegExp(delimiter) !== delimiter) {
                imports += "\nimport re";
                pattern = `re.compile(${pattern})`;
            }

            // the default delimiter in Pandas is a single whitespace
            const patternParam = delimiter === " " ? "" : `pat=${pattern}, `;
            return {
                /**
                 * Example: split text using string ' ' in 'Name' column
                 * ```
                 * import pandas as pd
                 * loc_0 = df.columns.get_loc('Name')
                 * df_split = df['Name'].str.split(pat=' ', expand=True).add_prefix('Name_')
                 * df = pd.concat([df.iloc[:, :loc_0], df_split, df.iloc[:, loc_0:]], axis=1)
                 * df = df.drop(columns=['Name'])
                 * ```
                 */
                getCode: () =>
                    [
                        imports,
                        columns
                            .map((col, idx) => {
                                const prefix = `'${escapeSingleQuote(col.name)}_'`;
                                return [
                                    `loc_${idx} = ${df}.columns.get_loc(${col.key})`,
                                    `${df}_split = ${df}[${col.key}].str.split(${patternParam}expand=True).add_prefix(${prefix})`,
                                    `${df} = pd.concat([${df}.iloc[:, :loc_${idx}], ${df}_split, ${df}.iloc[:, loc_${idx}:]], axis=1)`
                                ].join("\n");
                            })
                            .join("\n"),
                        `${df} = ${df}.drop(columns=[${columns.map((col) => col.key).join(", ")}])`
                    ].join("\n")
            };
        }
    })
};
