import { OperationKey } from "@dw/orchestrator";
import { FilterCondition, FilterOperationBase, JoinType } from "../../../core/operations/filter";
import { extendBaseOperation } from "../../../core/translate";
import { toPythonValueString } from "../../util";

export default {
    [OperationKey.Filter]: extendBaseOperation(FilterOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, condition, additionalConditions } = ctx.baseProgram;
            const condPythonValue = toPythonValueString(condition.conditionValue, condition.type);
            let hasDateTimeValue = condPythonValue.isDateTime;
            let shouldImportPySparkFunctions = condition.matchCase;

            const firstConditionExpression = getConditionExpression(
                df,
                condition.columnKey,
                condition.conditionType,
                condPythonValue.value,
                condition.matchCase
            );

            const otherConditionExpressions = additionalConditions.map((cond) => {
                const condPythonValue = toPythonValueString(cond.conditionValue, cond.type);
                hasDateTimeValue = hasDateTimeValue || condPythonValue.isDateTime;
                shouldImportPySparkFunctions = shouldImportPySparkFunctions || cond.matchCase;
                const expression = getConditionExpression(
                    df,
                    cond.columnKey,
                    cond.conditionType,
                    condPythonValue.value,
                    cond.matchCase
                );
                return ` ${cond.joinType === JoinType.And ? "&" : "|"} (${expression})`;
            });

            let imports = hasDateTimeValue ? "from datetime import datetime\n" : "";
            if (shouldImportPySparkFunctions) {
                imports += "from pyspark.sql import functions as F\n";
            }

            const firstCondition =
                additionalConditions.length > 0 ? `(${firstConditionExpression})` : firstConditionExpression;
            const otherConditions = otherConditionExpressions.join("");

            return {
                /**
                 * Example: Filter df where 'Age' is greater than 10 and 'Embarked' is 'S'
                 * ```
                 * df = df.filter((df['Age'] > 10) & (df['Embarked'] == 'S'))
                 * ```
                 */
                getCode: () => imports + `${df} = ${df}.filter(${firstCondition}${otherConditions})`
            };
        }
    })
};

function getConditionExpression(
    df: string,
    columnKey: string,
    filterCondition: FilterCondition,
    value?: any,
    matchCase?: undefined | boolean
): string {
    let columnExpr = `${df}[${columnKey}]`;
    const baseColumnExpr = columnExpr;
    if (matchCase) {
        columnExpr = `F.lower(${columnExpr})`;
        value = `${value}.lower()`;
    }
    switch (filterCondition) {
        case FilterCondition.Equal:
            return `${columnExpr} == ${value}`;
        case FilterCondition.NotEqual:
            return `~${columnExpr}.eqNullSafe(${value})`;
        case FilterCondition.GreaterThan:
            return `${columnExpr} > ${value}`;
        case FilterCondition.GreaterThanOrEqual:
            return `${columnExpr} >= ${value}`;
        case FilterCondition.LessThan:
            return `${columnExpr} < ${value}`;
        case FilterCondition.LessThanOrEqual:
            return `${columnExpr} <= ${value}`;
        case FilterCondition.NaN:
            return `${columnExpr}.isNull()`;
        case FilterCondition.NotNaN:
            return `${columnExpr}.isNotNull()`;
        case FilterCondition.IsTrue:
            return `${columnExpr} == True`;
        case FilterCondition.IsFalse:
            return `${columnExpr} == False`;
        case FilterCondition.StartsWith:
            return `${columnExpr}.startswith(${value})`;
        case FilterCondition.EndsWith:
            return `${columnExpr}.endswith(${value})`;
        case FilterCondition.Has:
            return `${columnExpr}.contains(${value})`;
        case FilterCondition.NotHas:
            return `~${columnExpr}.contains(${value}) | ${baseColumnExpr}.isNull()`;
    }
}
