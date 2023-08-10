import { OperationKey } from "@dw/orchestrator";
import { MatchType, ReplaceAllOperationBase } from "../../../core/operations/replaceAll";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";
import { escapeRegExp } from "../../../core/operations/util";

export default {
    [OperationKey.ReplaceAll]: extendBaseOperation(ReplaceAllOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, columnKeys, type, match, newValue } = ctx.baseProgram;
            const oldPythonValue = toPythonValueString(match.value, type);
            const newPythonValue = toPythonValueString(newValue, type);
            const imports =
                oldPythonValue.isDateTime || newPythonValue.isDateTime ? "from datetime import datetime\n" : "";

            if (match.type === MatchType.String && !(match.matchFullString && match.matchCase && !match.useRegEx)) {
                return {
                    getCode: () =>
                        imports +
                        columnKeys
                            .map((key) => {
                                /**
                                 * Example: replace all instances of ham in the 'BreakfastMenu' column with "SPAM"
                                 * ```
                                 * from pyspark.sql import functions as F
                                 * df = df.withColumn('BreakfastMenu', F.regexp_replace('BreakfastMenu', "ham", "SPAM"))
                                 * ```
                                 */
                                const caseInsensitive = !match.matchCase ? "(?i)" : "";
                                const matchValueEscaped = match.useRegEx ? match.value : escapeRegExp(match.value);
                                const oldValue =
                                    caseInsensitive +
                                    (match.matchFullString ? "^" + matchValueEscaped + "$" : matchValueEscaped);
                                const matchedPythonValue = toPythonValueString(oldValue, type);
                                return [
                                    "from pyspark.sql import functions as F",
                                    `${df} = ${df}.withColumn(${key}, F.regexp_replace(${key}, ${matchedPythonValue.value}, ${newPythonValue.value}))`
                                ].join("\n");
                            })
                            .join("\n")
                };
            }

            return {
                /**
                 * Example: replace all instances of 0 in the 'Survived' column with 1
                 * ```
                 * df = df.replace(0, value=1, subset=['Survived'])
                 * ```
                 */
                getCode: () =>
                    imports +
                    `${df} = ${df}.replace(${oldPythonValue.value}, value=${
                        newPythonValue.value
                    }, subset=[${columnKeys.join(", ")}])`
            };
        }
    })
};
