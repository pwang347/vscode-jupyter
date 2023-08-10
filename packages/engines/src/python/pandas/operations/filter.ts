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
                const expression = getConditionExpression(
                    df,
                    cond.columnKey,
                    cond.conditionType,
                    condPythonValue.value,
                    cond.matchCase
                );
                return ` ${cond.joinType === JoinType.And ? "&" : "|"} (${expression})`;
            });

            const imports = hasDateTimeValue ? "from datetime import datetime\n" : "";
            const firstCondition =
                additionalConditions.length > 0 ? `(${firstConditionExpression})` : firstConditionExpression;
            const otherConditions = otherConditionExpressions.join("");

            return {
                /**
                 * Example: Filter df where 'Age' is greater than 10 and 'Embarked' is 'S'
                 * ```
                 * df = df[(df['Age'] > 10) & (df['Embarked'] == 'S')]
                 * ```
                 */
                getCode: () => imports + `${df} = ${df}[${firstCondition}${otherConditions}]`
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
    const columnExpr = `${df}[${columnKey}]`;
    const matchCaseInline = matchCase === false ? ", case=False" : "";
    switch (filterCondition) {
        case FilterCondition.Equal:
            return `${columnExpr} == ${value}`;
        case FilterCondition.NotEqual:
            return `${columnExpr} != ${value}`;
        case FilterCondition.GreaterThan:
            return `${columnExpr} > ${value}`;
        case FilterCondition.GreaterThanOrEqual:
            return `${columnExpr} >= ${value}`;
        case FilterCondition.LessThan:
            return `${columnExpr} < ${value}`;
        case FilterCondition.LessThanOrEqual:
            return `${columnExpr} <= ${value}`;
        case FilterCondition.NaN:
            return `${columnExpr}.isna()`;
        case FilterCondition.NotNaN:
            return `${columnExpr}.notna()`;
        case FilterCondition.IsTrue:
            return `${columnExpr} == True`;
        case FilterCondition.IsFalse:
            return `${columnExpr} == False`;
        case FilterCondition.StartsWith:
            return `${columnExpr}.str.startswith(${value}, na=False)`;
        case FilterCondition.EndsWith:
            return `${columnExpr}.str.endswith(${value}, na=False)`;
        case FilterCondition.Has:
            return `${columnExpr}.str.contains(${value}, na=False${matchCaseInline})`;
        case FilterCondition.NotHas:
            return `~${columnExpr}.str.contains(${value}, na=False${matchCaseInline})`;
    }
}
