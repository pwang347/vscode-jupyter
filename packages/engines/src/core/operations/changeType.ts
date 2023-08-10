import {
    ArgType,
    ColumnType,
    createArg,
    IColumnTarget,
    IColumnTypeMetadataMapping,
    IResolvedPackageDependencyMap
} from "@dw/messaging";
import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from "@dw/orchestrator";
import { formatColumnNamesInDescription } from "./util";

/**
 * A type that can be casted to.
 */
export type CastableType<T extends ColumnType = ColumnType> = {
    label: string;
    type: T;
    metadata: IColumnTypeMetadataMapping[T];
};

type IChangeTypeOperationArgs = {
    TargetColumns: {
        value: IColumnTarget[];
    };
    TargetType: {
        value: string;
    };
};
type IChangeTypeOperationConfig = {
    getCastableRawTypes: (dependencies: IResolvedPackageDependencyMap) => Array<CastableType>;
};
type IChangeTypeBaseProgram<T extends ColumnType = ColumnType> = {
    variableName: string;
    columnKeys: string[];
    targetType: CastableType<T>;
    dependencies: IResolvedPackageDependencyMap;
};

/**
 * Base operation to change the type of columns.
 */
export const ChangeTypeOperationBase: (
    config: IChangeTypeOperationConfig
) => IGenericOperation<IChangeTypeOperationArgs, IChangeTypeBaseProgram, typeof LocalizedStrings.Orchestrator> = (
    config
) => ({
    category: OperationCategory.Schema,
    generateBaseProgram: (ctx) => {
        if (ctx.args.TargetColumns.value.length === 0) {
            return {
                result: OperationCodeGenResultType.Incomplete
            };
        }
        const availableChoices = config.getCastableRawTypes(ctx.dependencies);
        const foundType = availableChoices.find((choice) => choice.label === ctx.args.TargetType.value);

        // sanity check the inputs: don't assume that the UI handles this
        if (!foundType) {
            return {
                result: OperationCodeGenResultType.Failure,
                reason: ctx.getLocalizedStrings(ctx.locale).UnknownError
            };
        }

        const columnKeys = ctx.args.TargetColumns.value.map((c) => c.key);

        return {
            getBaseProgram: () => ({
                variableName: ctx.variableName,
                columnKeys: columnKeys,
                targetType: foundType,
                dependencies: ctx.dependencies
            }),
            getDescription: (locale) =>
                ctx.formatString(
                    ctx.args.TargetColumns.value.length === 1
                        ? ctx.getLocalizedStrings(locale).OperationChangeTypeDescription
                        : ctx.getLocalizedStrings(locale).OperationChangeTypeDescriptionPlural,
                    formatColumnNamesInDescription(columnKeys, ctx.getLocalizedStrings(locale)),
                    ctx.args.TargetType.value
                ),
            getTelemetryProperties: () => {
                const uniqueRawTypes = new Set(
                    ctx.args.TargetColumns.value.map((col) => ctx.dataframe.columns[col.index].rawType)
                );
                return {
                    properties: {
                        // redact after set to maintain uniqueness
                        oldTypes: Array.from(uniqueRawTypes).map(ctx.redactCustomRawType).join(","),
                        newType: ctx.args.TargetType.value
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
        const availableChoices = config.getCastableRawTypes(ctx.dependencies);
        return [
            createArg(
                "TargetColumns",
                ArgType.Target,
                undefined,
                ctx.getLocalizedStrings(ctx.locale).OperationArgTargetMultiselect
            ),
            createArg("TargetType", ArgType.Category, {
                choices: availableChoices.map((tc) => ({
                    key: tc.label,
                    label: tc.label
                })),
                default: availableChoices[0].label
            })
        ];
    },
    defaultTargetFilter: {
        allowUnknownType: true,
        allowMixedType: true
    }
});
