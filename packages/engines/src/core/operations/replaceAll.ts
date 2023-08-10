import { ArgType, ColumnType, createArg, IColumnTarget, IOperationArgView } from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

/**
 * Type of match.
 */
export enum MatchType {
    Default = "default",
    String = "string"
}

export type IReplaceAllOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
        subMenu: {
            OldValue: any;
            OldValueOptionsByType: {
                MatchFullString?: boolean;
                MatchCase?: boolean;
                UseRegEx?: boolean;
            };
            NewValue: any;
        };
    };
};
type IReplaceAllBaseProgram = {
    variableName: string;
    columnKeys: string[];
    type: ColumnType;
    match:
        | {
              type: MatchType.Default;
              value: any;
          }
        | {
              type: MatchType.String;
              value: string;
              matchFullString: boolean;
              matchCase: boolean;
              useRegEx: boolean;
          };
    newValue: any;
};

/**
 * Base operation to replace all values in a column.
 */
export const ReplaceAllOperationBase: () => IGenericOperation<
    IReplaceAllOperationArgs,
    IReplaceAllBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.FindAndReplace,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        if (
            ctx.args.TargetColumns.subMenu.OldValue === "" &&
            ctx.args.TargetColumns.subMenu.NewValue !== "" &&
            !ctx.args.TargetColumns.subMenu.OldValueOptionsByType.MatchFullString
        ) {
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    OldValue: ctx.getLocalizedStrings(ctx.locale).OldValueEmptyError
                } as any
            };
        }

        const type = ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index].type;
        const rawType = ctx.dataframe.columns[ctx.args.TargetColumns.value[0].index].rawType;
        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    columnKeys,
                    type,
                    match:
                        type === ColumnType.String
                            ? {
                                  type: MatchType.String,
                                  value: ctx.args.TargetColumns.subMenu.OldValue,
                                  matchFullString: Boolean(
                                      ctx.args.TargetColumns.subMenu.OldValueOptionsByType.MatchFullString
                                  ),
                                  matchCase: Boolean(ctx.args.TargetColumns.subMenu.OldValueOptionsByType.MatchCase),
                                  useRegEx: Boolean(ctx.args.TargetColumns.subMenu.OldValueOptionsByType.UseRegEx)
                              }
                            : {
                                  type: MatchType.Default,
                                  value: ctx.args.TargetColumns.subMenu.OldValue
                              },
                    newValue: ctx.args.TargetColumns.subMenu.NewValue
                };
            },
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationReplaceAllDescription
                        : ctx.getLocalizedStrings(locale).OperationReplaceAllDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                    ctx.stringifyValue(ctx.args.TargetColumns.subMenu.OldValue, type),
                    ctx.stringifyValue(ctx.args.TargetColumns.subMenu.NewValue, type)
                ),
            getTelemetryProperties: () => {
                return {
                    properties: {
                        rawType: ctx.redactCustomRawType(rawType)
                    },
                    measurements: {
                        numTargets: ctx.args.TargetColumns.value.length
                    }
                };
            },
            previewStrategy: PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx) => {
        const oldValueOptionsByType: { [key in ColumnType]: IOperationArgView[] } = {
            boolean: [],
            category: [],
            datetime: [],
            float: [],
            integer: [],
            string: [
                createArg(
                    "MatchFullString",
                    ArgType.Boolean,
                    {
                        default: false
                    },
                    LocalizedStrings.Orchestrator.OperationReplaceAllMatchFullString
                ),
                createArg(
                    "MatchCase",
                    ArgType.Boolean,
                    {
                        default: false
                    },
                    LocalizedStrings.Orchestrator.OperationReplaceAllMatchCase
                ),
                createArg(
                    "UseRegEx",
                    ArgType.Boolean,
                    {
                        default: false
                    },
                    LocalizedStrings.Orchestrator.OperationReplaceAllUseRegEx
                )
            ],
            timedelta: [],
            complex: [],
            period: [],
            interval: [],
            unknown: []
        };
        return [
            createArg(
                "TargetColumns",
                ArgType.Target,
                {
                    targetFilter: {
                        requiresSameType: true,
                        allowMixedType: true
                    },
                    subMenu: [
                        createArg(
                            "OldValue",
                            ArgType.VariableColumnType,
                            undefined,
                            ctx.getLocalizedStrings(ctx.locale).OperationReplaceAllArgsOldValue
                        ),
                        createArg("OldValueOptionsByType", ArgType.TypeDependent, oldValueOptionsByType),
                        createArg(
                            "NewValue",
                            ArgType.VariableColumnType,
                            undefined,
                            ctx.getLocalizedStrings(ctx.locale).OperationReplaceAllArgsNewValue
                        )
                    ],
                    keepSubMenuStateOnTargetChange: true
                },
                ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
            )
        ];
    }
});
