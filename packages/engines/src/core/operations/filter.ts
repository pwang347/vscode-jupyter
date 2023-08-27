// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ArgType, ColumnType, createArg, IArgLayoutHint, IColumnTarget, IOperationArgView } from '@dw/messaging';
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation,
    IDataWranglerOperationArgContext
} from '@dw/orchestrator';
import { formatColumnNamesInDescription } from './util';

/**
 * Types of filter conditions.
 */
export enum FilterCondition {
    NaN = 'nan',
    NotNaN = 'notNan',
    IsTrue = 'isTrue',
    IsFalse = 'isFalse',
    Equal = 'equal',
    NotEqual = 'notEqual',
    StartsWith = 'startsWith',
    EndsWith = 'endsWith',
    Has = 'has',
    NotHas = 'notHas',
    GreaterThan = 'greaterThan',
    GreaterThanOrEqual = 'greaterThanOrEqual',
    LessThan = 'lessThan',
    LessThanOrEqual = 'lessThanOrEqual'
}

/**
 * Type of join.
 */
export enum JoinType {
    And = 'and',
    Or = 'or'
}

export type IFilterOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
        subMenu: {
            TypedCondition: {
                Condition: {
                    value: FilterCondition;
                    subMenu: {
                        Value: any;
                        MatchCase?: boolean;
                    };
                };
            };
        };
    };
    AdditionalConditions: {
        children: Array<{
            Join: {
                value: JoinType;
            };
            TargetColumns: {
                value: IColumnTarget[];
                subMenu: {
                    TypedCondition: {
                        Condition: {
                            value: FilterCondition;
                            subMenu: {
                                Value: any;
                                MatchCase?: boolean;
                            };
                        };
                    };
                };
            };
        }>;
    };
};
export type IFilterBaseProgram = {
    variableName: string;
    condition: {
        columnKey: string;
        type: ColumnType;
        conditionType: FilterCondition;
        conditionValue?: any;
        matchCase?: boolean;
    };
    additionalConditions: Array<{
        joinType: JoinType;
        columnKey: string;
        type: ColumnType;
        conditionType: FilterCondition;
        conditionValue?: any;
        matchCase?: boolean;
    }>;
};

/**
 * Base operation to filter columns.
 */
export const FilterOperationBase: () => IGenericOperation<
    IFilterOperationArgs,
    IFilterBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.SortAndFilter,
    generateBaseProgram: (ctx) => {
        if (
            ctx.args.TargetColumns.value.length === 0 ||
            !ctx.args.TargetColumns.subMenu.TypedCondition.Condition.value ||
            ctx.args.AdditionalConditions.children.some(
                (cond) =>
                    cond.TargetColumns.value.length === 0 || !cond.TargetColumns.subMenu.TypedCondition.Condition.value
            )
        ) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        const uniqueColumnKeys = Array.from(
            new Set([
                ctx.args.TargetColumns.value[0].key,
                ...ctx.args.AdditionalConditions.children.map((cond) => cond.TargetColumns.value[0].key)
            ])
        );

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    condition: {
                        columnKey: ctx.args.TargetColumns.value[0].key,
                        type: ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index]?.type,
                        conditionType: ctx.args.TargetColumns.subMenu.TypedCondition.Condition.value,
                        conditionValue: ctx.args.TargetColumns.subMenu.TypedCondition.Condition.subMenu.Value,
                        matchCase: ctx.args.TargetColumns.subMenu.TypedCondition.Condition.subMenu.MatchCase
                    },
                    additionalConditions: ctx.args.AdditionalConditions.children.map((cond) => ({
                        joinType: cond.Join.value,
                        columnKey: cond.TargetColumns.value[0].key,
                        type: ctx.dataframe.columns[cond.TargetColumns.value[0].index]?.type,
                        conditionType: cond.TargetColumns.subMenu.TypedCondition.Condition.value,
                        conditionValue: cond.TargetColumns.subMenu.TypedCondition.Condition.subMenu.Value,
                        matchCase: cond.TargetColumns.subMenu.TypedCondition.Condition.subMenu.MatchCase
                    }))
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    uniqueColumnKeys.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationFilterDescription
                        : ctx.getLocalizedStrings(locale).OperationFilterDescriptionPlural,
                    formatColumnNamesInDescription(uniqueColumnKeys, ctx.getLocalizedStrings(locale))
                ),
            getTelemetryProperties: () => {
                const uniqueFilterMethods = new Set(
                    [ctx.args.TargetColumns.subMenu.TypedCondition.Condition.value].concat(
                        ctx.args.AdditionalConditions.children.map(
                            (cond) => cond.TargetColumns.subMenu.TypedCondition.Condition.value
                        )
                    )
                );
                const uniqueRawTypes = new Set(
                    [ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index]?.rawType].concat(
                        ctx.args.AdditionalConditions.children.map(
                            (cond) => ctx.dataframe.columns[cond.TargetColumns.value[0].index].rawType
                        )
                    )
                );
                return {
                    properties: {
                        uniqueFilterMethods: Array.from(uniqueFilterMethods).join(','),
                        // redact after set to maintain uniqueness
                        uniqueRawTypes: Array.from(uniqueRawTypes).map(ctx.redactCustomRawType).join(',')
                    },
                    measurements: {
                        numConditions: ctx.args.AdditionalConditions.children.length + 1
                    }
                };
            },
            previewStrategy: PreviewStrategy.AddedOrRemovedRows,
            result: OperationCodeGenResultType.Success,
            customColumnAnnotations: (column) => {
                if (uniqueColumnKeys.find((key) => key === column.key)) {
                    return {
                        ...column.annotations,
                        isTargeted: true
                    };
                }
                return column.annotations;
            }
        };
    },
    getArgs: getFilterArgs
});

function getFilterArgs(ctx: IDataWranglerOperationArgContext<typeof LocalizedStrings.Orchestrator>) {
    const locStrings = ctx.getLocalizedStrings(ctx.locale);

    const commonConditions = [
        {
            key: FilterCondition.NaN,
            label: locStrings.OperationFilterArgsConditionIsMissing
        },
        {
            key: FilterCondition.NotNaN,
            label: locStrings.OperationFilterArgsConditionIsNotMissing
        }
    ];

    const booleanCondition = createArg('Condition', ArgType.Category, {
        choices: [
            {
                key: FilterCondition.IsTrue,
                label: locStrings.OperationFilterArgsConditionIsTrue
            },
            {
                key: FilterCondition.IsFalse,
                label: locStrings.OperationFilterArgsConditionIsFalse
            },
            ...commonConditions
        ],
        subMenuByChoice: {},
        placeholder: locStrings.OperationFilterArgsSelectCondition,
        layoutHint: IArgLayoutHint.InlineGrow
    });

    const stringValue = createArg('Value', ArgType.String, { layoutHint: IArgLayoutHint.InlineGrow });
    const matchCase = createArg(
        'MatchCase',
        ArgType.Boolean,
        { layoutHint: IArgLayoutHint.InlineGrow, default: true },
        locStrings.OperationFilterArgsMatchCase
    );
    const stringCondition = createArg('Condition', ArgType.Category, {
        choices: [
            {
                key: FilterCondition.Equal,
                label: locStrings.OperationFilterArgsConditionEqualTo
            },
            {
                key: FilterCondition.NotEqual,
                label: locStrings.OperationFilterArgsConditionNotEqualTo
            },
            {
                key: FilterCondition.StartsWith,
                label: locStrings.OperationFilterArgsConditionStartsWith
            },
            {
                key: FilterCondition.EndsWith,
                label: locStrings.OperationFilterArgsConditionEndsWith
            },
            {
                key: FilterCondition.Has,
                label: locStrings.OperationFilterArgsConditionContains
            },
            {
                key: FilterCondition.NotHas,
                label: locStrings.OperationFilterArgsConditionNotContains
            },
            ...commonConditions
        ],
        subMenuByChoice: {
            [FilterCondition.Equal]: [stringValue],
            [FilterCondition.NotEqual]: [stringValue],
            [FilterCondition.StartsWith]: [stringValue],
            [FilterCondition.EndsWith]: [stringValue],
            [FilterCondition.Has]: [stringValue, matchCase],
            [FilterCondition.NotHas]: [stringValue, matchCase]
        },
        placeholder: locStrings.OperationFilterArgsSelectCondition,
        layoutHint: IArgLayoutHint.InlineGrow
    });

    function getNumericalCondition(valueArg: IOperationArgView) {
        return createArg('Condition', ArgType.Category, {
            choices: [
                {
                    key: FilterCondition.Equal,
                    label: locStrings.OperationFilterArgsConditionEqualTo
                },
                {
                    key: FilterCondition.NotEqual,
                    label: locStrings.OperationFilterArgsConditionNotEqualTo
                },
                {
                    key: FilterCondition.GreaterThan,
                    label: locStrings.OperationFilterArgsConditionGreaterThan
                },
                {
                    key: FilterCondition.GreaterThanOrEqual,
                    label: locStrings.OperationFilterArgsConditionGreaterThanOrEqualTo
                },
                {
                    key: FilterCondition.LessThan,
                    label: locStrings.OperationFilterArgsConditionLessThan
                },
                {
                    key: FilterCondition.LessThanOrEqual,
                    label: locStrings.OperationFilterArgsConditionLessThanOrEqualTo
                },
                ...commonConditions
            ],
            subMenuByChoice: {
                [FilterCondition.Equal]: [valueArg],
                [FilterCondition.NotEqual]: [valueArg],
                [FilterCondition.GreaterThan]: [valueArg],
                [FilterCondition.GreaterThanOrEqual]: [valueArg],
                [FilterCondition.LessThan]: [valueArg],
                [FilterCondition.LessThanOrEqual]: [valueArg]
            },
            placeholder: locStrings.OperationFilterArgsSelectCondition,
            layoutHint: IArgLayoutHint.InlineGrow
        });
    }
    const integerCondition = getNumericalCondition(
        createArg('Value', ArgType.Integer, { layoutHint: IArgLayoutHint.InlineGrow })
    );
    const floatCondition = getNumericalCondition(
        createArg('Value', ArgType.Float, { layoutHint: IArgLayoutHint.InlineGrow })
    );
    const datetimeCondition = getNumericalCondition(
        createArg('Value', ArgType.Datetime, { layoutHint: IArgLayoutHint.InlineGrow })
    );
    const timedeltaCondition = getNumericalCondition(
        createArg('Value', ArgType.Timedelta, { layoutHint: IArgLayoutHint.InlineGrow })
    );

    const typedArgs: { [key in ColumnType]: IOperationArgView[] } = {
        boolean: [booleanCondition],
        category: [stringCondition],
        datetime: [datetimeCondition],
        float: [floatCondition],
        integer: [integerCondition],
        string: [stringCondition],
        timedelta: [timedeltaCondition],
        complex: [],
        period: [],
        interval: [],
        unknown: []
    };

    return [
        createArg(
            'TargetColumns',
            ArgType.Target,
            {
                targetFilter: {
                    isSingleTarget: true,
                    allowMixedType: true
                },
                subMenu: [createArg('TypedCondition', ArgType.TypeDependent, typedArgs)],
                layoutHint: IArgLayoutHint.InlineGrow
            },
            ctx.getLocalizedStrings(ctx.locale).OperationArgTarget
        ),
        createArg('AdditionalConditions', ArgType.ArgGroup, {
            args: [
                createArg('Join', ArgType.Category, {
                    choices: [
                        {
                            key: JoinType.And,
                            label: locStrings.OperationFilterArgsConditionJoinAnd
                        },
                        {
                            key: JoinType.Or,
                            label: locStrings.OperationFilterArgsConditionJoinOr
                        }
                    ],
                    layoutHint: IArgLayoutHint.InlineGrow
                }),
                createArg(
                    'TargetColumns',
                    ArgType.Target,
                    {
                        targetFilter: {
                            isSingleTarget: true,
                            allowMixedType: true
                        },
                        subMenu: [createArg('TypedCondition', ArgType.TypeDependent, typedArgs)],
                        layoutHint: IArgLayoutHint.InlineGrow
                    },
                    ctx.getLocalizedStrings(ctx.locale).OperationArgTarget
                )
            ],
            addGroupLabel: locStrings.OperationFilterArgsAddCondition,
            sequentiallyFillTargets: true,
            sequentiallyFillTargetsOffset: 1
        })
    ];
}
