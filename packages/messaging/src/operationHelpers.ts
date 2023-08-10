import { IDataFrameColumn, IDataFrameHeader, PreviewAnnotationType } from "./dataframe";
import { ColumnType } from "./datatypes";
import { ArgType, IArgOptionMapping, IColumnTarget, IOperationArgView, ITargetFilter } from "./operations";

/**
 * Mapping of argument types to their default values.
 */
const defaultValueMap: { [type in ArgType]: () => any } = {
    [ArgType.Target]: () => ({
        value: [],
        subMenu: {}
    }),
    [ArgType.ArgGroup]: () => ({
        children: []
    }),
    [ArgType.VariableColumnType]: () => null,
    [ArgType.TypeDependent]: () => null,
    [ArgType.Formula]: () => "",
    [ArgType.String]: () => "",
    [ArgType.Boolean]: () => false,
    [ArgType.Integer]: () => 0,
    [ArgType.Float]: () => 0.0,
    [ArgType.Category]: () => ({
        value: undefined,
        subMenu: {}
    }),
    [ArgType.Timedelta]: () => "P0DT0H0M0S", // see https://en.wikipedia.org/wiki/ISO_8601#Durations
    [ArgType.Datetime]: () => new Date().toISOString()
};

/**
 * Given selected targets, returns the inferred type.
 */
export function getSelectionType(selectedTargets: IDataFrameColumn[]) {
    let knownType;
    let allSameTypes = selectedTargets.length > 0;
    for (const target of selectedTargets) {
        // Grab the type directly from the column. Previously this looked up the column by index.
        // However the index may have been modified to align with the original df,
        // so it cannot be reliably used to look up from the preview df.
        const columnType = target.type;
        if (!knownType) {
            knownType = columnType;
        } else if (knownType !== columnType) {
            allSameTypes = false;
            break;
        }
    }

    if (allSameTypes && knownType) {
        return knownType;
    }

    return null;
}

/**
 * Given a variable type column arg and selected targets, returns the inferred type and options.
 */
function getVariableTypeAndOptions(
    arg: IOperationArgView<ArgType.VariableColumnType>,
    selectedTargets: IDataFrameColumn[]
) {
    let type;
    let options;

    // sanity check: check for variable column type args
    if (arg.type === ArgType.VariableColumnType) {
        const knownType = getSelectionType(selectedTargets);
        if (knownType) {
            type = knownType as any as ArgType;
            options = arg.options[type] ?? {};
            return { type, options };
        }
    }
}

/**
 * Failed filter result types.
 */
export enum FailedFilterCode {
    SingleColumnOnly = "singleColumnOnly",
    MixedColumn = "mixedColumn",
    UnknownType = "unknownType",
    RawTypeMismatch = "rawTypeMismatch",
    TypeMismatch = "typeMismatch",
    TypesNotSame = "typesNotSame"
}

/**
 * Filtering logic for columns using target filter interface.
 */
export function filterColumn(
    column: IDataFrameColumn,
    currentSelection: IDataFrameColumn[],
    filter?: ITargetFilter
): FailedFilterCode | undefined {
    if (!filter?.allowMixedType && column.isMixed) {
        return FailedFilterCode.MixedColumn;
    }
    if (!filter?.allowUnknownType && column.type === ColumnType.Unknown) {
        return FailedFilterCode.UnknownType;
    }
    if (!filter) {
        return;
    }
    if (filter.allowedRawTypes && !filter.allowedRawTypes.includes(column.rawType)) {
        return FailedFilterCode.RawTypeMismatch;
    }
    if (filter.allowedTypes && !filter.allowedTypes.includes(column.type)) {
        return FailedFilterCode.TypeMismatch;
    }
    if (
        currentSelection.length > 0 &&
        filter.requiresSameType &&
        !currentSelection.map((column) => column.type).includes(column.type)
    ) {
        return FailedFilterCode.TypesNotSame;
    }
    if (filter.isSingleTarget && currentSelection.length > 0) {
        return FailedFilterCode.SingleColumnOnly;
    }
    return;
}

/**
 * Creates the default argument object whenever the operation changes.
 */
export function getDefaultArgs(
    dataFrameHeader: IDataFrameHeader,
    args: IOperationArgView[],
    selectedTargets: IDataFrameColumn[]
): Record<string, any> {
    const defaultArgs: { [key: string]: any } = {};
    for (const arg of args) {
        let type = arg.type;
        let options = arg.options;
        let defaultValue = defaultValueMap[type] ? defaultValueMap[type]() : undefined;

        // if the argument is variable typed and we have a homogenous set of columns, use column type
        if (arg.type === ArgType.VariableColumnType) {
            const variableColumnArg = arg as IOperationArgView<ArgType.VariableColumnType>;
            const result = getVariableTypeAndOptions(variableColumnArg, selectedTargets);
            if (result) {
                type = result.type;
                options = result.options;
                // set the default value again using the newly found type
                defaultValue = defaultValueMap[type] ? defaultValueMap[type]() : undefined;
            }
        } else if (arg.type === ArgType.TypeDependent) {
            const typeDependentOptions = options as IArgOptionMapping[ArgType.TypeDependent];
            const columnType = getSelectionType(selectedTargets);
            defaultValue = columnType
                ? getDefaultArgs(dataFrameHeader, typeDependentOptions[columnType], selectedTargets)
                : {};
        }

        // handle formula arguments
        if (type === ArgType.Formula) {
            const formulaOptions = options as IArgOptionMapping[ArgType.Formula];
            if (formulaOptions.default !== undefined) {
                defaultValue = formulaOptions.default;
            }
        }

        // handle boolean arguments
        if (type === ArgType.Boolean) {
            const booleanOptions = options as IArgOptionMapping[ArgType.Boolean];
            if (booleanOptions.default !== undefined) {
                defaultValue = booleanOptions.default;
            }
        }
        // handle integer arguments
        else if (type === ArgType.Integer) {
            const intOptions = options as IArgOptionMapping[ArgType.Integer];
            if (intOptions.default !== undefined) {
                defaultValue = intOptions.default;
            }
        }
        // handle float arguments
        else if (type === ArgType.Float) {
            const floatOptions = options as IArgOptionMapping[ArgType.Float];
            if (floatOptions.default !== undefined) {
                defaultValue = floatOptions.default;
            }
        }
        // handle category arguments
        else if (type === ArgType.Category) {
            const categoryOptions = options as IArgOptionMapping[ArgType.Category];
            if (
                categoryOptions.default !== undefined &&
                categoryOptions.choices.some((c) => c.key === categoryOptions.default)
            ) {
                defaultValue = {
                    value: categoryOptions.default,
                    subMenu: {}
                };
            } else {
                // default to the first key only if there is no placeholder text specified.
                if (!categoryOptions.placeholder && categoryOptions.choices.length > 0) {
                    defaultValue = {
                        value: categoryOptions.choices[0].key,
                        subMenu: {}
                    };
                }
            }
            if (categoryOptions.subMenuByChoice) {
                defaultValue = {
                    value: defaultValue.value,
                    subMenu: getDefaultArgs(
                        dataFrameHeader,
                        categoryOptions.subMenuByChoice[defaultValue.value] || [],
                        selectedTargets
                    )
                };
            }
        }
        // handle string arguments
        else if (type === ArgType.String) {
            const stringOptions = options as IArgOptionMapping[ArgType.String];
            if (stringOptions.default !== undefined) {
                defaultValue = stringOptions.default;
            }
            if (stringOptions.isUniqueColumnName) {
                defaultValue = getUniqueColumnName(
                    defaultValue,
                    dataFrameHeader.columns.map((c) => c.name)
                );
            }
        } else if (type === ArgType.Target) {
            const targetOptions = options as IArgOptionMapping[ArgType.Target];
            const columnTypeMap: { [key: string]: string } = {};
            const columnTargets = getTargetableColumns(dataFrameHeader, {
                keepIndex: false,
                colTransformer: (column) => {
                    columnTypeMap[column.key] = column.type;
                    return column;
                },
                extraFilter: (column) => filterColumn(column, [], targetOptions.targetFilter) === undefined
            });
            if (targetOptions.selectAllByDefault) {
                defaultValue = {
                    value: columnTargets,
                    subMenu: getDefaultArgs(dataFrameHeader, targetOptions.subMenu ?? [], columnTargets)
                };
            } else {
                let selectedColumnTargets: IDataFrameColumn[] = [];
                for (const target of selectedTargets) {
                    if (target.key in columnTypeMap) {
                        selectedColumnTargets.push(target);
                    }
                }
                if (selectedColumnTargets.length > 0) {
                    // if same type is required, pre-fill using the first type found
                    if (targetOptions.targetFilter?.requiresSameType) {
                        let firstType = columnTypeMap[selectedColumnTargets[0].key];
                        selectedColumnTargets = selectedColumnTargets.filter(
                            (target) => columnTypeMap[target.key] === firstType
                        );

                        // if single target, pre-fill using the first target
                    } else if (targetOptions.targetFilter?.isSingleTarget) {
                        selectedColumnTargets = [selectedColumnTargets[0]];
                    }
                }
                defaultValue = {
                    value: selectedColumnTargets,
                    subMenu: getDefaultArgs(dataFrameHeader, targetOptions.subMenu ?? [], selectedColumnTargets)
                };
            }
        } else if (type === ArgType.ArgGroup) {
            const argGroupOptions = options as IArgOptionMapping[ArgType.ArgGroup];
            if (argGroupOptions.sequentiallyFillTargets) {
                const columnTargets = getTargetableColumns(dataFrameHeader, {
                    keepIndex: false,
                    colTransformer: (column) => {
                        return { key: column.key, name: column.name, index: column.index };
                    }
                });
                const columnTargetsSet = new Set(columnTargets.map((target) => target.key));
                const targets = selectedTargets
                    .filter((target) => columnTargetsSet.has(target.key))
                    .slice(argGroupOptions.sequentiallyFillTargetsOffset);
                defaultValue = {
                    children: targets.map((target) => {
                        return getDefaultArgs(dataFrameHeader, argGroupOptions.args, [target]);
                    })
                };
            }
        }

        defaultArgs[arg.key] = defaultValue;
    }
    return defaultArgs;
}

/**
 * Gets the column targets present in the given arguments.
 * Since args can take on many forms this is just searches generic objects / arrays for objects that look like a column target.
 * */
export function getTargetedColumns(args: any) {
    const found: Map<string, IColumnTarget> = new Map();

    function isColumnTarget(value: any): value is IColumnTarget {
        return value && typeof value === "object" && "key" in value && "name" in value && "index" in value;
    }

    function search(obj: any) {
        if (!obj) return;
        if (Array.isArray(obj)) {
            obj.forEach(search);
        } else if (typeof obj === "object") {
            if (isColumnTarget(obj)) {
                found.set(obj.key, obj);
            } else {
                search(Object.values(obj));
            }
        }
    }

    search(args);

    return Array.from(found.values());
}

/**
 * Generates a unique column name.
 */
export function getUniqueColumnName(baseName: string, columnNames: string[]) {
    const seen = new Set<string>(columnNames);
    let newName = baseName;
    let suffixCount = 0;
    while (seen.has(newName)) {
        suffixCount += 1;
        newName = `${baseName}_${suffixCount}`;
    }
    return newName;
}

/**
 * Filters out the preview-only column names.
 */
export function getTargetableColumnNames(dataFrame?: IDataFrameHeader, keepIndex = true) {
    return getTargetableColumns(dataFrame, { colTransformer: (column) => column.name, keepIndex });
}

/**
 * Filters out the preview-only columns.
 */
export function getTargetableColumns<T = IDataFrameColumn>(
    dataFrame?: IDataFrameHeader,
    options?: {
        colTransformer?: (column: IDataFrameColumn) => T;
        extraFilter?: (column: IDataFrameColumn) => boolean;
        keepIndex?: boolean;
        reverseCondition?: boolean;
        adjustIndices?: boolean;
    }
): T[] {
    if (!dataFrame) {
        return [];
    }
    const keepIndex = options?.keepIndex ?? true;
    const adjustIndices = options?.adjustIndices ?? false;
    const reverseCondition = options?.reverseCondition ?? false;

    const columns: T[] = [];
    if (dataFrame) {
        for (let i = keepIndex ? 0 : 1; i < dataFrame.columns.length; i++) {
            // ignore columns that are unique to the current preview
            const column = { ...dataFrame.columns[i] };
            const isPreview = column.annotations?.annotationType === PreviewAnnotationType.Added;
            const extraFilter = options?.extraFilter?.(column) ?? true;
            if ((reverseCondition ? !isPreview : isPreview) || !extraFilter) {
                continue;
            }
            if (adjustIndices) {
                column.index = keepIndex ? columns.length : columns.length + 1;
            }
            columns.push((options?.colTransformer ? options.colTransformer(column) : column) as T);
        }
    }
    return columns;
}
