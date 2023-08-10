import { OperationKey } from "@dw/orchestrator";
import { extendBaseOperation } from "../../../core/translate";
import { CastableType, ChangeTypeOperationBase } from "../../../core/operations/changeType";
import { PandasDTypes } from "../types";
import {
    ColumnType,
    IColumnTypeMetadataMapping,
    IResolvedPackageDependencyMap,
    TranslationValidationResultType
} from "@dw/messaging";

const allSupportedPandasColumnTypeChanges: Array<CastableType> = [
    {
        label: PandasDTypes.Object,
        type: ColumnType.Unknown,
        metadata: {}
    },
    {
        label: PandasDTypes.String,
        type: ColumnType.String,
        metadata: {}
    },
    {
        label: PandasDTypes.DateTime64,
        type: ColumnType.Datetime,
        metadata: {}
    },
    {
        label: PandasDTypes.TimeDelta64,
        type: ColumnType.Timedelta,
        metadata: {}
    },
    {
        label: PandasDTypes.Category,
        type: ColumnType.Category,
        metadata: {}
    },
    {
        label: PandasDTypes.Float16,
        type: ColumnType.Float,
        metadata: {
            bits: 16
        }
    },
    {
        label: PandasDTypes.Float32,
        type: ColumnType.Float,
        metadata: {
            bits: 32
        }
    },
    {
        label: PandasDTypes.Float64,
        type: ColumnType.Float,
        metadata: {
            bits: 64
        }
    },
    {
        label: PandasDTypes.Int8,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 8
        }
    },
    {
        label: PandasDTypes.Int16,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 16
        }
    },
    {
        label: PandasDTypes.Int32,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 32
        }
    },
    {
        label: PandasDTypes.Int64,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 64
        }
    },
    {
        label: PandasDTypes.UInt8,
        type: ColumnType.Integer,
        metadata: {
            unsigned: true,
            bits: 8
        }
    },
    {
        label: PandasDTypes.UInt16,
        type: ColumnType.Integer,
        metadata: {
            unsigned: true,
            bits: 16
        }
    },
    {
        label: PandasDTypes.UInt32,
        type: ColumnType.Integer,
        metadata: {
            unsigned: true,
            bits: 32
        }
    },
    {
        label: PandasDTypes.UInt64,
        type: ColumnType.Integer,
        metadata: {
            unsigned: true,
            bits: 64
        }
    },
    {
        label: PandasDTypes.Bool,
        type: ColumnType.Boolean,
        metadata: {}
    }
];

// these types are only allowed in pandas v1.0.0 and higher
export const extensionPandasColumnTypeChanges = new Set<PandasDTypes>([PandasDTypes.String]);

function isPandasV1AndHigher(dependencies: IResolvedPackageDependencyMap) {
    const pandasVersion = dependencies.satisfied["pandas"]?.installedVersion;
    return pandasVersion && pandasVersion.match(/^[1-9]\d*\.\d+\.\d+$/);
}

function getCastableRawTypes(dependencies: IResolvedPackageDependencyMap) {
    // for Pandas v1.0.0+ we can support additional type casting for extension dtypes
    if (isPandasV1AndHigher(dependencies)) {
        return allSupportedPandasColumnTypeChanges;
    }
    return allSupportedPandasColumnTypeChanges.filter((type) => {
        return !extensionPandasColumnTypeChanges.has(type.label as PandasDTypes);
    });
}

const basicPandasDTypeMap: { [key in ColumnType]?: PandasDTypes } = {
    [ColumnType.Boolean]: PandasDTypes.Bool,
    [ColumnType.Category]: PandasDTypes.Category,
    [ColumnType.Datetime]: PandasDTypes.DateTime64,
    [ColumnType.Timedelta]: PandasDTypes.TimeDelta64
};

function toPandasDType<T extends ColumnType = ColumnType>(
    dependencies: IResolvedPackageDependencyMap,
    type: T,
    metadata: IColumnTypeMetadataMapping[T]
): PandasDTypes | undefined {
    if (type in basicPandasDTypeMap) {
        return basicPandasDTypeMap[type]!;
    }
    if (type === ColumnType.String) {
        if (isPandasV1AndHigher(dependencies)) {
            return PandasDTypes.String;
        } else {
            return PandasDTypes.Object;
        }
    }
    if (type === ColumnType.Float) {
        const floatMetadata = metadata as IColumnTypeMetadataMapping[ColumnType.Float];
        switch (floatMetadata.bits) {
            case 16:
                return PandasDTypes.Float16;
            case 32:
                return PandasDTypes.Float32;
            case 64:
                return PandasDTypes.Float64;
        }
    }
    if (type === ColumnType.Integer) {
        const integerMetadata = metadata as IColumnTypeMetadataMapping[ColumnType.Integer];
        if (integerMetadata.unsigned) {
            switch (integerMetadata.bits) {
                case 8:
                    return PandasDTypes.UInt8;
                case 16:
                    return PandasDTypes.UInt16;
                case 32:
                    return PandasDTypes.UInt32;
                case 64:
                    return PandasDTypes.UInt64;
            }
        } else {
            switch (integerMetadata.bits) {
                case 8:
                    return PandasDTypes.Int8;
                case 16:
                    return PandasDTypes.Int16;
                case 32:
                    return PandasDTypes.Int32;
                case 64:
                    return PandasDTypes.Int64;
            }
        }
    }
    if (type === ColumnType.Unknown) {
        return PandasDTypes.Object;
    }
}

export default {
    [OperationKey.ChangeType]: extendBaseOperation(ChangeTypeOperationBase, {
        config: {
            getCastableRawTypes
        },
        translateBaseProgram: (ctx) => {
            const { variableName: df, targetType, columnKeys, dependencies } = ctx.baseProgram;
            const pandasType = toPandasDType(dependencies, targetType.type, targetType.metadata);
            if (!pandasType) {
                return {
                    getCode: () => ""
                };
            }
            const asTypeDict = `{${columnKeys.map((key) => `${key}: '${pandasType}'`).join(", ")}}`;
            return {
                /**
                 * Example: convert 'Survived' column to type 'bool'
                 * ```
                 * df = df.astype({'Survived': 'bool'})
                 * ```
                 */
                getCode: () => `${df} = ${df}.astype(${asTypeDict})`
            };
        },
        validateBaseProgram: (ctx) => {
            const { baseProgram, formatString, getLocalizedStrings } = ctx;
            const { targetType, dependencies } = baseProgram;
            const pandasType = toPandasDType(dependencies, targetType.type, targetType.metadata);
            if (!pandasType) {
                return {
                    type: TranslationValidationResultType.Warning,
                    id: "pandas-no-equivalent-type",
                    getMessage: (locale) => {
                        return formatString(
                            getLocalizedStrings(locale).OperationChangeTypeWarningNoEquivalentType,
                            baseProgram.targetType.label
                        );
                    }
                };
            }
            return {
                type: TranslationValidationResultType.Success
            };
        }
    })
};
