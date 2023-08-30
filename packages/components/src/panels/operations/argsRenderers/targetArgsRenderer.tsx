// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    ArgType,
    typeEqual,
    FailedFilterCode,
    filterColumn,
    formatString,
    getDefaultArgs,
    getSelectionType,
    getTargetableColumns,
    IDataFrameColumn,
    IOperationArgView
} from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../../customRender";
import { ArgsRenderer } from "./types";

/**
 * Target args renderer.
 */
const TargetArgsRenderer: ArgsRenderer<ArgType.Target> = (context, renderOperationPanelArgument) => {
    const {
        arg,
        dataFrame,
        currentArgState,
        onChange,
        key,
        isPanelDisabled,
        label,
        inputErrors,
        locStrings,
        renderers
    } = context;
    const targetArgOptions = arg.options;
    const columns = getTargetableColumns(dataFrame, { keepIndex: false, adjustIndices: true });
    const columnsMap: { [key: string]: IDataFrameColumn } = {};
    for (const column of columns) {
        columnsMap[column.key] = column;
    }
    const selectedColumnType = columns.find((c) => c.key === currentArgState[arg.key]?.value[0]?.key)?.type;
    const selectedColumnTargets = currentArgState[arg.key]?.value;

    const selectedColumnNames: string[] = selectedColumnTargets.map((columns: IDataFrameColumn) => {
        return columns.key;
    });
    const subMenuArgs: IOperationArgView[] = targetArgOptions.subMenu ?? [];
    const subMenuArgsRendered = subMenuArgs.flatMap((a) =>
        renderOperationPanelArgument({
            ...context,
            arg: a,
            onChangeOverride: (value) => {
                const newArgsBase = { ...currentArgState[arg.key].subMenu, [a.key]: value };
                onChange({
                    key: currentArgState[arg.key].key,
                    value: currentArgState[arg.key].value,
                    subMenu: newArgsBase
                });
            },
            argsStateOverride: currentArgState[arg.key].subMenu,
            keyOverride: key + "_" + a.key,
            typeContext: selectedColumnType,
            targetsContext: selectedColumnTargets
        })
    );
    const targetFilter = targetArgOptions.targetFilter;
    const choices =
        columns.map((c) => {
            let disabledReason;
            if (!targetFilter) {
                return { key: c.key, label: c.name, disabledReason };
            }
            const filterResult = filterColumn(
                c,
                selectedColumnNames.map((c) => columnsMap[c]),
                targetArgOptions.targetFilter
            );
            if (filterResult === FailedFilterCode.MixedColumn) {
                disabledReason = locStrings.TargetDisabledMixedColumn;
            } else if (filterResult === FailedFilterCode.UnknownType) {
                disabledReason = formatString(locStrings.TargetDisabledUnknownType, c.rawType);
            } else if (
                filterResult === FailedFilterCode.RawTypeMismatch ||
                filterResult === FailedFilterCode.TypeMismatch
            ) {
                disabledReason = formatString(locStrings.TargetDisabledTypeMismatch, c.rawType);
            } else if (filterResult === FailedFilterCode.TypesNotSame) {
                disabledReason = locStrings.TargetDisabledTypesNotSame;
            }

            // prepend the column name to the disabled reason
            if (disabledReason) {
                disabledReason = formatString(locStrings.CannotSelectTargetReason, c.name, disabledReason);
            }
            return { key: c.key, label: c.name, disabledReason, filterResult };
        }) ?? [];
    // move disabled targets to the end
    choices.sort((a, b) => {
        return a.filterResult === b.filterResult ||
            // don't sort when changing targets
            (!a.filterResult && b.filterResult === FailedFilterCode.TypesNotSame) ||
            (!b.filterResult && a.filterResult === FailedFilterCode.TypesNotSame)
            ? 0
            : !a.filterResult
            ? -1
            : 1;
    });
    const columnTargetFieldRender = renderCustom({
        props: {
            key: currentArgState[arg.key]?.key || key || label,
            disabled: isPanelDisabled,
            label,
            choices,
            multiSelect: !targetFilter?.isSingleTarget,
            disableSelectAll:
                !!targetFilter?.requiresSameType &&
                columns.length > 1 &&
                selectedColumnNames.length === 0 &&
                getSelectionType(columns) === null,
            onChange: (value) => {
                if (!dataFrame) {
                    return;
                }
                const selectedColumns = value.map((columnKey) => columnsMap[columnKey]);
                if (!selectedColumns) {
                    return;
                }
                const result = {
                    key: currentArgState[arg.key].key,
                    value: selectedColumns,
                    subMenu: {}
                };

                if (targetArgOptions.subMenu && targetArgOptions.subMenu.length > 0) {
                    const defaultArgs = getDefaultArgs(dataFrame, targetArgOptions.subMenu, selectedColumns);
                    result.subMenu = defaultArgs;

                    if (targetArgOptions.keepSubMenuStateOnTargetChange) {
                        const userArgs = currentArgState[arg.key].subMenu;
                        if (typeEqual(defaultArgs, userArgs)) {
                            result.subMenu = userArgs;
                        }
                    }
                }

                onChange(result);
            },
            selectedColumnNames,
            errorMessage: inputErrors?.[arg.key],
            layoutHint: arg.options.layoutHint
        },
        defaultRender: () => null,
        customRender: renderers?.onRenderTargetField
    });
    return [<React.Fragment key={key}>{columnTargetFieldRender}</React.Fragment>, ...subMenuArgsRendered];
};

export default TargetArgsRenderer;
