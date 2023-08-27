// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ArgType, createArg, IColumnTarget } from '@dw/messaging';
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from '@dw/orchestrator';
import { formatColumnNamesInDescription } from './util';

/**
 * Sort order.
 */
export enum SortOrder {
    Ascending = 'ascending',
    Descending = 'descending'
}

export type ISortOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    SortOrder: {
        value: SortOrder;
    };
    MissingValuesFirst: boolean;
    AdditionalSortColumns: {
        children: Array<{
            TargetColumns: {
                value: IColumnTarget[];
            };
            SortOrder: {
                value: SortOrder;
            };
        }>;
    };
};
export type ISortBaseProgram = {
    variableName: string;
    columnKeysSort: Array<{
        columnKey: string;
        sort: SortOrder;
    }>;
    missingValuesFirst: boolean;
};

/**
 * Base operation to sort columns.
 */
export const SortOperationBase: () => IGenericOperation<
    ISortOperationArgs,
    ISortBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.SortAndFilter,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        // Ignore additional columns that have not (yet) been completely defined
        const validAdditionalColumns = ctx.args.AdditionalSortColumns.children.filter(
            (col) => !!(col.TargetColumns.value[0]?.name && col.SortOrder)
        );
        const allColumns = [
            ctx.args.TargetColumns.value[0].key,
            ...validAdditionalColumns.map((c) => c.TargetColumns.value[0].key)
        ];
        const ascendingFlags = [ctx.args.SortOrder.value, ...validAdditionalColumns.map((c) => c.SortOrder.value)];
        const columnKeysSort = allColumns.map((key, idx) => {
            return {
                columnKey: key,
                sort: ascendingFlags[idx]
            };
        });

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeysSort,
                    missingValuesFirst: ctx.args.MissingValuesFirst
                };
            },
            getDescription: (locale) => {
                const locStrings = ctx.getLocalizedStrings(locale);
                return ctx.formatString(
                    allColumns.length === 1
                        ? locStrings.OperationSortDescription
                        : locStrings.OperationSortDescriptionPlural,
                    formatColumnNamesInDescription(
                        columnKeysSort.map((col, i) =>
                            ctx.formatString(
                                ascendingFlags[i] === 'ascending'
                                    ? locStrings.OperationSortDescriptionAscendingLabel
                                    : locStrings.OperationSortDescriptionDescendingLabel,
                                col.columnKey
                            )
                        ),
                        ctx.getLocalizedStrings(locale)
                    )
                );
            },
            getTelemetryProperties: () => {
                const rawType = ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index]?.rawType;
                const uniqueRawTypes = new Set(
                    [rawType].concat(
                        ctx.args.AdditionalSortColumns.children.map(
                            (cond) => ctx.dataframe.columns[cond.TargetColumns.value[0].index].rawType
                        )
                    )
                );
                return {
                    properties: {
                        isMissingValuesFirst: ctx.args.MissingValuesFirst.toString(),
                        // redact after set to maintain uniqueness
                        uniqueRawTypes: Array.from(uniqueRawTypes).map(ctx.redactCustomRawType).join(',')
                    },
                    measurements: {
                        numSortTargets: ctx.args.AdditionalSortColumns.children.length + 1
                    }
                };
            },
            previewStrategy: PreviewStrategy.NoneWithCachedStats,
            result: OperationCodeGenResultType.Success,
            customColumnAnnotations: (column) => {
                if (
                    ctx.args.TargetColumns.value.find((col) => col.key === column.key) ||
                    ctx.args.AdditionalSortColumns.children.find((child) => {
                        return child.TargetColumns.value.find((col) => col.key === column.key);
                    })
                ) {
                    return {
                        ...column.annotations,
                        isTargeted: true
                    };
                }
                return column.annotations;
            }
        };
    },
    getArgs: (ctx) => [
        createArg(
            'TargetColumns',
            ArgType.Target,
            {
                targetFilter: {
                    isSingleTarget: true,
                    allowUnknownType: true
                }
            },
            ctx.getLocalizedStrings(ctx.locale).OperationSortArgsColumnName
        ),
        createArg('SortOrder', ArgType.Category, {
            choices: [
                {
                    key: 'ascending',
                    label: ctx.getLocalizedStrings(ctx.locale).OperationSortOrderAscending
                },
                {
                    key: 'descending',
                    label: ctx.getLocalizedStrings(ctx.locale).OperationSortOrderDescending
                }
            ]
        }),
        createArg('AdditionalSortColumns', ArgType.ArgGroup, {
            args: [
                createArg(
                    'TargetColumns',
                    ArgType.Target,
                    {
                        targetFilter: {
                            isSingleTarget: true,
                            allowUnknownType: true
                        }
                    },
                    ctx.getLocalizedStrings(ctx.locale).OperationSortArgsColumnName
                ),
                createArg(
                    'SortOrder',
                    ArgType.Category,
                    {
                        choices: [
                            {
                                key: 'ascending',
                                label: ctx.getLocalizedStrings(ctx.locale).OperationSortOrderAscending
                            },
                            {
                                key: 'descending',
                                label: ctx.getLocalizedStrings(ctx.locale).OperationSortOrderDescending
                            }
                        ]
                    },
                    ctx.getLocalizedStrings(ctx.locale).OperationSortArgsSortOrder
                )
            ],
            addGroupLabel: ctx.getLocalizedStrings(ctx.locale).OperationSortArgsAddColumn,
            sequentiallyFillTargets: true,
            sequentiallyFillTargetsOffset: 1
        }),
        createArg('MissingValuesFirst', ArgType.Boolean)
    ]
});
