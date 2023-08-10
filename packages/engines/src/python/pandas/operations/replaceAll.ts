import { OperationKey } from "@dw/orchestrator";
import { MatchType, ReplaceAllOperationBase } from "../../../core/operations/replaceAll";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";

export default {
    [OperationKey.ReplaceAll]: extendBaseOperation(ReplaceAllOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, type, match, newValue } = ctx.baseProgram;
            const oldPythonValue = toPythonValueString(match.value, type);
            const newPythonValue = toPythonValueString(newValue, type);
            const imports =
                oldPythonValue.isDateTime || newPythonValue.isDateTime ? "from datetime import datetime\n" : "";

            if (match.type === MatchType.String) {
                return {
                    /**
                     * Example: replace all instances of ham in the 'BreakfastMenu' column with "SPAM"
                     * ```
                     * df['BreakfastMenu'] = df['BreakfastMenu'].str.replace("ham", "SPAM", regex=False)
                     * ```
                     */
                    getCode: () =>
                        imports +
                        columnKeys
                            .map((key) => {
                                // When using the Match Full String option and not using RegEx, we use loc instead of the str.replace method since str.replace doesn't have a flag for full string matching
                                if (match.matchFullString && !match.useRegEx) {
                                    if (match.matchCase) {
                                        // Example: df.loc[df['BreakfastMenu'] == "ham", 'BreakfastMenu'] = "SPAM"
                                        return [
                                            `${df}.loc[${df}[${key}] == ${oldPythonValue.value}, ${key}] = ${newPythonValue.value}`
                                        ];
                                    } else {
                                        // Example: df.loc[df['BreakfastMenu'].str.lower() == "ham".lower(), 'BreakfastMenu'] = "SPAM"
                                        return [
                                            `${df}.loc[${df}[${key}].str.lower() == ${oldPythonValue.value}.lower(), ${key}] = ${newPythonValue.value}`
                                        ];
                                    }
                                }

                                // Now we'll use the str.replace method for the rest of the string cases. We'll now build the arguments to pass into that method.

                                //////////// positional arguments ////////////
                                // `pat` argument
                                const patternArg =
                                    match.matchFullString && match.useRegEx
                                        ? // When both full match and regex options are selected, we simply add ^ and $ around the user-provided regex so that it matches the full string
                                          toPythonValueString("^" + match.value + "$", type).value
                                        : oldPythonValue.value;
                                // `repl` argument
                                const replacementArg = newPythonValue.value;

                                //////////// keyword arguments ////////////
                                const keywordArgs: string[] = [];
                                // `case` argument
                                // True by default when `pat` is a string (and we only provide a string and not a compiled regex, so this always applies to us).
                                // We only need to set it explicitly when not case-sensitive.
                                if (!match.matchCase) {
                                    keywordArgs.push("case=False");
                                }
                                // `regex` argument
                                keywordArgs.push(`regex=${match.useRegEx ? "True" : "False"}`);

                                //////////// combine positional and keyword arguments ////////////
                                const argsString = [patternArg, replacementArg, ...keywordArgs].join(", ");

                                return [`${df}[${key}] = ${df}[${key}].str.replace(${argsString})`];
                            })
                            .join("\n")
                };
            }

            return {
                /**
                 * Example: replace all instances of 0 in the 'Survived' column with 1
                 * ```
                 * df.loc[df_2['Survived'] == 0, 'Survived'] = 1
                 * ```
                 */
                getCode: () =>
                    imports +
                    columnKeys
                        .map(
                            (key) =>
                                `${df}.loc[${df}[${key}] == ${oldPythonValue.value}, ${key}] = ${newPythonValue.value}`
                        )
                        .join("\n")
            };
        }
    })
};
