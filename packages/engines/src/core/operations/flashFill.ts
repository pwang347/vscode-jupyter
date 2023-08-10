import {
    ArgType,
    createArg,
    getTargetableColumns,
    IColumnTarget,
    IGridCellEdit,
    PreviewAnnotationType
} from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { DefaultProseExamplesCount, DeriveColumnResult, IProseExample } from "@dw/orchestrator/lib/prose";
import { doesColumnNameExistInNonPreviewState, formatColumnNamesInDescription } from "./util";
import { WranglerEngineIdentifier } from "../../types";

const memo: { [key: string]: DeriveColumnResult } = {};

type IFlashFillOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    DerivedColumnName: string;
};
type IFlashFillOperationConfig = {
    category?: OperationCategory;
    exampleTransformer?: (value: string) => any;
};
type IFlashFillBaseProgram = {
    variableName: string;
    insertIndex: number;
    newColumnName: string;
    derivedCode?: { [key in WranglerEngineIdentifier]?: string };
};

/**
 * Base operation to perform FlashFill using PROSE.
 */
export const FlashFillOperationBase: (
    config: IFlashFillOperationConfig
) => IGenericOperation<IFlashFillOperationArgs, IFlashFillBaseProgram, typeof LocalizedStrings.Orchestrator> = (
    config
) => ({
    showOldPreviewOnError: true,
    category: config.category,
    generateBaseProgram: async (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }

        // telemetry properties for failure cases
        const getFailureTelemetryProperties = () => {
            const uniqueRawTypes = new Set(
                ctx.args.TargetColumns.value.map((col) => ctx.dataframe.columns[col.index].rawType)
            );
            return {
                properties: {
                    derivedProgram: "false",
                    // redact after set to maintain uniqueness
                    uniqueRawTypes: Array.from(uniqueRawTypes).map(ctx.redactCustomRawType).join(",")
                },
                measurements: {
                    numTargets: ctx.args.TargetColumns.value.length,
                    numEdits: ctx.gridCellEdits.length
                }
            };
        };

        // disallow duplicate column names
        if (doesColumnNameExistInNonPreviewState(ctx.dataframe, ctx.args.DerivedColumnName)) {
            return {
                result: OperationCodeGenResultType.Failure,
                inputErrors: {
                    DerivedColumnName: ctx.formatString(
                        ctx.getLocalizedStrings(ctx.locale).ColumnExistsError,
                        `'${ctx.args.DerivedColumnName}'`
                    )
                },
                getTelemetryProperties: getFailureTelemetryProperties
            };
        }

        const primarySelectedColumn = ctx.args.TargetColumns.value.reduce((rightMostColumn, currentColumn, _) =>
            currentColumn.index > rightMostColumn.index ? currentColumn : rightMostColumn
        );

        // case 1: no examples are provided
        if (ctx.gridCellEdits.length === 0) {
            return {
                /**
                 * Example: derive column with no examples
                 * ```
                 * df.insert(4, 'Name_derived',  df.apply(lambda row : "", axis=1))
                 * ```
                 */
                // since we don't have any examples to learn on yet, just return a program that creates an empty column
                getBaseProgram: () => ({
                    variableName: ctx.variableName,
                    insertIndex: primarySelectedColumn.index,
                    newColumnName: ctx.args.DerivedColumnName
                }),
                getDescription: (locale: string) =>
                    ctx.formatString(
                        ctx.args.TargetColumns.value.length === 1
                            ? ctx.getLocalizedStrings(locale).OperationFlashFillDescription
                            : ctx.getLocalizedStrings(locale).OperationFlashFillDescriptionPlural,
                        formatColumnNamesInDescription(
                            ctx.args.TargetColumns.value.map((c) => `'${c.name}'`),
                            ctx.getLocalizedStrings(locale)
                        ),
                        `'${ctx.args.DerivedColumnName}'`
                    ),
                customColumnAnnotations: (column) => {
                    if (column.annotations && column.annotations.annotationType === PreviewAnnotationType.Added) {
                        return {
                            ...column.annotations,
                            editableCells: true
                        };
                    }
                    return column.annotations;
                },
                getTelemetryProperties: getFailureTelemetryProperties,
                previewStrategy: PreviewStrategy.ModifiedColumns,
                result: OperationCodeGenResultType.Success
            };
        }

        // case 2: we have examples
        // determine which columns we actually care about in our data
        const selectedColumnIndices = ctx.args.TargetColumns.value.map((col) => col.index);

        // we don't need to sanitize the names here since PROSE will handle that for us
        const newColumnNames = ctx.args.TargetColumns.value.map((col) => col.name);

        // Get max row needed between prose examples and cell edits
        const maxRowNeeded = ctx.gridCellEdits.reduce(
            (max, edit) => Math.max(max, edit.row + 1),
            DefaultProseExamplesCount
        );

        const rows = await ctx.dataframe.loadRows(maxRowNeeded);

        // Filter out the preview column.
        const previewColumnIndices = new Set(
            getTargetableColumns(ctx.dataframe, { reverseCondition: true }).map((column) => column.index)
        );
        const rowData = rows.map((row) => row.data.filter((_, index) => !previewColumnIndices.has(index)));

        // reduce noise - map the inputs such that they only contain the targeted columns
        // also drop missing values, since there's no .NET representation for that
        const additionalInputs = rowData
            .slice(0, DefaultProseExamplesCount)
            .map((input: any[]) => {
                const subsetInput = selectedColumnIndices.reduce(
                    (subsetInputSoFar: { [key: string]: any }, selectedColumn: number, index: number) => {
                        subsetInputSoFar[newColumnNames[index]] = input[selectedColumn];
                        return subsetInputSoFar;
                    },
                    {}
                );

                // sanity check: fail if the actual data doesn't have the same number of columns as the selection
                if (Object.keys(subsetInput).length !== selectedColumnIndices.length) {
                    return {
                        result: OperationCodeGenResultType.Failure,
                        reason: ctx.getLocalizedStrings(ctx.locale).UnknownError,
                        getTelemetryProperties: getFailureTelemetryProperties
                    };
                }

                return subsetInput;
            })
            .filter((subsetInput) => Object.values(subsetInput).every((input) => input !== null));

        // reduce noise - map the examples such that they only contain the targeted columns
        // also drop missing values, since there's no .NET representation for that
        let examples: IProseExample[];

        try {
            examples = ctx.gridCellEdits
                .map((gridEdit: IGridCellEdit) => {
                    const subsetInput = selectedColumnIndices.reduce(
                        (subsetInputSoFar: { [key: string]: any }, selectedColumn: number, index: number) => {
                            const row = rowData[gridEdit.row];
                            // sanity check: the row should exist.
                            if (!row) {
                                throw new Error(ctx.getLocalizedStrings(ctx.locale).UnknownError);
                            }
                            subsetInputSoFar[newColumnNames[index]] = row[selectedColumn];
                            return subsetInputSoFar;
                        },
                        {}
                    );

                    // sanity check: fail if the actual data doesn't have the same number of columns as the selection
                    if (Object.keys(subsetInput).length !== selectedColumnIndices.length) {
                        throw new Error(ctx.getLocalizedStrings(ctx.locale).UnknownError);
                    }
                    return {
                        input: subsetInput,
                        output: config?.exampleTransformer ? config.exampleTransformer(gridEdit.value) : gridEdit.value
                    };
                })
                .filter((subsetInput) => Object.values(subsetInput).every((input) => input !== null));
        } catch (e) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: ctx.getLocalizedStrings(ctx.locale).UnknownError,
                getTelemetryProperties: getFailureTelemetryProperties
            };
        }

        // compute schema for the columns used
        const schema: { [key: string]: string } = {};
        ctx.args.TargetColumns.value.map((col, idx) => {
            const newColName = newColumnNames[idx];
            schema[newColName] = ctx.dataframe.columns[col.index].rawType!;
        });

        const serialized = JSON.stringify([
            ctx.engineId,
            schema,
            examples,
            additionalInputs,
            ctx.args.DerivedColumnName,
            ctx.variableName,
            primarySelectedColumn.index
        ]);
        const derivedColumnResult = memo[serialized]
            ? memo[serialized]
            : await ctx.proseApiClient.deriveColumn(
                  ctx.engineId,
                  [WranglerEngineIdentifier.Pandas, WranglerEngineIdentifier.PySpark],
                  schema,
                  examples,
                  additionalInputs,
                  ctx.args.DerivedColumnName,
                  ctx.variableName,
                  primarySelectedColumn.index
              );

        // short-circuit with the appropriate message if we received a known error type
        if (!derivedColumnResult.success) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: ctx.getLocalizedStrings(ctx.locale)[`FlashFill${derivedColumnResult.errorCode}`],
                getTelemetryProperties: getFailureTelemetryProperties
            };
        }

        memo[serialized] = derivedColumnResult;

        // the server portion uses a different set of enums - make sure that we are aligned to that
        // see the enum in https://github.com/microsoft/vscode-data-wrangler-internal/blob/main/native/DataWrangler.PROSE.Common/Common.cs
        const derivedCode: { [key in WranglerEngineIdentifier]?: string } = {};
        const serverToClientEngineMapping: { [key: string]: WranglerEngineIdentifier } = {
            Pandas: WranglerEngineIdentifier.Pandas,
            PySpark: WranglerEngineIdentifier.PySpark
        };
        for (const key of Object.keys(derivedColumnResult.derivedPrograms)) {
            const mappedKey = serverToClientEngineMapping[key];
            if (mappedKey) {
                derivedCode[mappedKey] = derivedColumnResult.derivedPrograms[key];
            }
        }

        const derivedProgram = derivedCode[ctx.engineId as WranglerEngineIdentifier];
        if (!derivedProgram) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: ctx.getLocalizedStrings(ctx.locale).UnknownError,
                getTelemetryProperties: getFailureTelemetryProperties
            };
        }

        return {
            getBaseProgram: () => {
                return {
                    variableName: ctx.variableName,
                    insertIndex: primarySelectedColumn.index,
                    newColumnName: ctx.args.DerivedColumnName,
                    derivedCode
                };
            },
            getDescription: (locale: string) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationFlashFillDescription
                        : ctx.getLocalizedStrings(locale).OperationFlashFillDescriptionPlural,
                    formatColumnNamesInDescription(
                        ctx.args.TargetColumns.value.map((c) => `'${c.name}'`),
                        ctx.getLocalizedStrings(locale)
                    ),
                    `'${ctx.args.DerivedColumnName}'`
                ),
            customColumnAnnotations: (column) => {
                if (column.annotations && column.annotations.annotationType === PreviewAnnotationType.Added) {
                    return {
                        ...column.annotations,
                        editableCells: true,
                        significantCells: derivedColumnResult.significantInputs
                    };
                }
                return column.annotations;
            },
            getTelemetryProperties: () => {
                const uniqueRawTypes = new Set(
                    ctx.args.TargetColumns.value.map((col) => ctx.dataframe.columns[col.index].rawType)
                );
                return {
                    properties: {
                        derivedProgram: "true",
                        // redact after set to maintain uniqueness
                        uniqueRawTypes: Array.from(uniqueRawTypes).map(ctx.redactCustomRawType).join(",")
                    },
                    measurements: {
                        numTargets: ctx.args.TargetColumns.value.length,
                        numEdits: ctx.gridCellEdits.length,
                        numSignificantInputs: derivedColumnResult.significantInputs.length
                    }
                };
            },
            previewStrategy: PreviewStrategy.ModifiedColumns,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: (ctx) => [
        createArg(
            "TargetColumns",
            ArgType.Target,
            undefined,
            ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
        ),
        createArg(
            "DerivedColumnName",
            ArgType.String,
            {
                default: "derivedCol",
                isUniqueColumnName: true
            },
            ctx.getLocalizedStrings(ctx.locale).OperationFlashFillArgsDerivedColumnName
        )
    ]
});
