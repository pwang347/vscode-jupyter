import { OperationKey } from "@dw/orchestrator";
import { extendBaseOperation } from "../../../core/translate";
import { CastableType, ChangeTypeOperationBase } from "../../../core/operations/changeType";
import { PySparkDTypes } from "../types";
import {
    ColumnType,
    IColumnTypeMetadataMapping,
    IResolvedPackageDependencyMap,
    TranslationValidationResultType
} from "@dw/messaging";

const allSupportedPySparkColumnTypeChanges: Array<CastableType> = [
    {
        label: PySparkDTypes.String,
        type: ColumnType.String,
        metadata: {}
    },
    {
        label: PySparkDTypes.Timestamp,
        type: ColumnType.Datetime,
        metadata: {}
    },
    {
        label: PySparkDTypes.Float,
        type: ColumnType.Float,
        metadata: {
            bits: 32
        }
    },
    {
        label: PySparkDTypes.Double,
        type: ColumnType.Float,
        metadata: {
            bits: 64
        }
    },
    {
        label: PySparkDTypes.Byte,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 8
        }
    },
    {
        label: PySparkDTypes.Short,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 16
        }
    },
    {
        label: PySparkDTypes.Integer,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 32
        }
    },
    {
        label: PySparkDTypes.Long,
        type: ColumnType.Integer,
        metadata: {
            unsigned: false,
            bits: 64
        }
    },
    {
        label: PySparkDTypes.Boolean,
        type: ColumnType.Boolean,
        metadata: {}
    }
];

function getCastableRawTypes() {
    return allSupportedPySparkColumnTypeChanges;
}

const basicPySparkDTypeMap: { [key in ColumnType]?: PySparkDTypes } = {
    [ColumnType.String]: PySparkDTypes.String,
    [ColumnType.Boolean]: PySparkDTypes.Boolean,
    [ColumnType.Datetime]: PySparkDTypes.Timestamp
};

function toPySparkDType<T extends ColumnType = ColumnType>(
    _dependencies: IResolvedPackageDependencyMap,
    type: T,
    metadata: IColumnTypeMetadataMapping[T]
): PySparkDTypes | undefined {
    if (type in basicPySparkDTypeMap) {
        return basicPySparkDTypeMap[type]!;
    }
    if (type === ColumnType.Float) {
        const floatMetadata = metadata as IColumnTypeMetadataMapping[ColumnType.Float];
        switch (floatMetadata.bits) {
            case 16:
            // fallthrough
            case 32:
                return PySparkDTypes.Float;
            case 64:
                return PySparkDTypes.Double;
        }
    }
    if (type === ColumnType.Integer) {
        const integerMetadata = metadata as IColumnTypeMetadataMapping[ColumnType.Integer];
        switch (integerMetadata.bits) {
            case 8:
                return PySparkDTypes.Byte;
            case 16:
                return PySparkDTypes.Short;
            case 32:
                return PySparkDTypes.Integer;
            case 64:
                return PySparkDTypes.Long;
        }
    }
}

export default {
    [OperationKey.ChangeType]: extendBaseOperation(ChangeTypeOperationBase, {
        config: {
            getCastableRawTypes
        },
        translateBaseProgram: (ctx) => {
            const { baseProgram } = ctx;
            const { variableName: df, targetType, columnKeys, dependencies } = baseProgram;
            const pysparkType = toPySparkDType(dependencies, targetType.type, targetType.metadata);
            if (!pysparkType) {
                return {
                    getCode: () => ""
                };
            }

            /**
             * Example: Change column type to BooleanType for column: 'Survived'
             * ```
             * from pyspark.sql import types as T
             * df = df.withColumn('Survived', df['Survived'].cast(T.BooleanType()))
             * ```
             */
            return {
                getCode: () =>
                    [
                        `from pyspark.sql import types as T`,
                        columnKeys
                            .map((key) => `${df} = ${df}.withColumn(${key}, ${df}[${key}].cast(T.${pysparkType}()))`)
                            .join("\n")
                    ].join("\n")
            };
        },
        validateBaseProgram: (ctx) => {
            const { baseProgram, formatString, getLocalizedStrings } = ctx;
            const { targetType, dependencies } = baseProgram;
            const pysparkType = toPySparkDType(dependencies, targetType.type, targetType.metadata);
            if (!pysparkType) {
                return {
                    type: TranslationValidationResultType.Warning,
                    id: "pyspark-no-equivalent-type",
                    getMessage: (locale) =>
                        formatString(
                            getLocalizedStrings(locale).OperationChangeTypeWarningNoEquivalentType,
                            targetType.label
                        )
                };
            }
            if (targetType.type === ColumnType.Float) {
                const floatMetadata = targetType.metadata as IColumnTypeMetadataMapping[ColumnType.Float];
                if (floatMetadata.bits !== 32 && floatMetadata.bits !== 64) {
                    return {
                        type: TranslationValidationResultType.Warning,
                        id: "pyspark-missing-bits-for-type",
                        getMessage: (locale) => getLocalizedStrings(locale).OperationChangeTypeWarningMissingBitsForType
                    };
                }
            }
            if (targetType.type === ColumnType.Integer) {
                const integerMetadata = targetType.metadata as IColumnTypeMetadataMapping[ColumnType.Integer];
                if (integerMetadata.unsigned) {
                    return {
                        type: TranslationValidationResultType.Warning,
                        id: "pyspark-missing-unsigned-type",
                        getMessage: (locale) =>
                            getLocalizedStrings(locale).OperationChangeTypeWarningMissingUnsignedType
                    };
                }
            }
            return {
                type: TranslationValidationResultType.Success
            };
        }
    })
};
