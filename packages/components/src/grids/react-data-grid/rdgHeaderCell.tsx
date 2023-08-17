// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import type { HeaderRendererProps } from "react-data-grid";
import {
    IViewComms,
    IDataFrameRow,
    IDataFrameColumn,
    IPreviewColumnAnnotation,
    ISelection,
    PreviewAnnotationType,
    ITelemetryLogger,
    WranglerTelemetryEvents,
    IDataFrameHeader,
    deepEqual,
    PreviewStrategy
} from "@dw/messaging";
import { GridSelectionPlugin } from "../plugins/gridSelectionPlugin";
import { GridContextMenuPlugin } from "../plugins/gridContextMenuPlugin";
import { IHeaderRenderers, HeaderLabelType } from "../types";
import { renderCustom } from "../../customRender";
import { GridSortPlugin } from '../plugins/gridSortPlugin';
import { GridFilterPlugin } from '../plugins/gridFilterPlugin';

/**
 * Props for the react-data-grid header cell.
 */
export interface IReactDataGridHeaderCellProps extends HeaderRendererProps<IDataFrameRow, unknown> {
    comms: IViewComms;
    columnAnnotations?: IPreviewColumnAnnotation;
    selection: ISelection;
    dataFrameColumn: IDataFrameColumn;
    dataFrameColumnIndex: number;
    gridContextMenuPlugin: GridContextMenuPlugin<any>;
    gridSelectionPlugin: GridSelectionPlugin<any>;
    gridSortPlugin: GridSortPlugin<any>;
    gridFilterPlugin: GridFilterPlugin<any>;
    renderers?: IHeaderRenderers;
    disabled: boolean;
    disableInteractions: boolean;
    disableCommitButton: boolean;
    rootRef: React.RefObject<HTMLDivElement>;
    tabIndex: number;
    onHeaderContextMenuShown?: (how: "context" | "button") => void;
    telemetryLogger?: ITelemetryLogger;
    activeHistoryIndex?: number;
    activeDataFrameHeader?: IDataFrameHeader;
    isEditingLastOperation: boolean;
    lastAppliedOperationHasUpdates: boolean;
    activeHistoryDataFrameHeader?: IDataFrameHeader;
    children?: React.ReactNode;
}

/**
 * A header cell for react-data-grid.
 */
export class ReactDataGridHeaderCell extends React.PureComponent<IReactDataGridHeaderCellProps> {
    render() {
        const {
            dataFrameColumn,
            columnAnnotations,
            selection,
            dataFrameColumnIndex,
            gridContextMenuPlugin,
            gridSelectionPlugin,
            renderers,
            rootRef,
            tabIndex,
            onHeaderContextMenuShown,
            isEditingLastOperation
        } = this.props;

        let className = "wrangler-grid-header-cell";
        let labelType = HeaderLabelType.Default;
        if (columnAnnotations) {
            if (columnAnnotations.annotationType === PreviewAnnotationType.Added) {
                className += " wrangler-grid-column-added";
                labelType = HeaderLabelType.Added;
            } else if (columnAnnotations.annotationType === PreviewAnnotationType.Removed) {
                className += " wrangler-grid-column-removed";
                labelType = HeaderLabelType.Removed;
            } else if (columnAnnotations.isTargeted) {
                className += " wrangler-grid-column-targeted";
                labelType = HeaderLabelType.Targeted;
            }
        }

        if (selection.columns.find((c) => c.index === dataFrameColumnIndex)) {
            className += " wrangler-grid-column-selected";
        }

        const button = this.renderHeaderButton();

        return (
            <div
                className={className}
                onContextMenu={(e) => {
                    e.preventDefault();
                    if (isEditingLastOperation) {
                        return;
                    }
                    onHeaderContextMenuShown?.("context");
                    gridContextMenuPlugin.showHeaderContextMenu(
                        { left: e.clientX, top: e.clientY },
                        dataFrameColumnIndex
                    );
                }}
                onClick={(e) => {
                    gridSelectionPlugin.selectColumn(dataFrameColumnIndex, e as any);
                }}
                ref={rootRef}
                tabIndex={tabIndex}
                onKeyDown={this.handleKeyDown}
            >
                <div className="wrangler-grid-header-cell-content-container">
                    {renderCustom({
                        props: {
                            label: dataFrameColumn.name,
                            labelType,
                            dataType: dataFrameColumn.type,
                            rawDataType: dataFrameColumn.rawType
                        },
                        defaultRender: (props) => {
                            return (
                                <div title={dataFrameColumn.name} style={{ alignSelf: "center" }}>
                                    {props.label}
                                </div>
                            );
                        },
                        customRender: renderers?.onRenderHeaderLabel
                    })}
                    {button}
                </div>
                {this.props.children}
            </div>
        );
    }

    private renderHeaderButton() {
        const {
            columnAnnotations,
            dataFrameColumnIndex,
            gridContextMenuPlugin,
            gridSortPlugin,
            gridFilterPlugin,
            renderers,
            disabled,
            disableInteractions,
            disableCommitButton,
            onHeaderContextMenuShown,
            activeHistoryIndex,
            activeDataFrameHeader,
            isEditingLastOperation,
            activeHistoryDataFrameHeader
        } = this.props;

        // nothing to show for the index column
        if (dataFrameColumnIndex === 0) {
            return null;
        }

        // If interactions should be disabled, we don't show the button
        if (disableInteractions) {
            return null;
        }

        // if the preview type is None, we shouldn't show anything here either
        if (
            !activeDataFrameHeader?.isPreviewUnchanged &&
            activeDataFrameHeader?.previewStrategy === PreviewStrategy.None
        ) {
            return null;
        }

        if (
            columnAnnotations?.annotationType === PreviewAnnotationType.Added ||
            columnAnnotations?.annotationType === PreviewAnnotationType.Removed ||
            columnAnnotations?.isTargeted
        ) {
            return renderCustom({
                props: {
                    // we disable in the following cases:
                    disabled:
                        // case 1: grid or commit button is disabled from the host
                        disabled ||
                        disableCommitButton ||
                        // case 2: we're viewing a past step but it's not editable
                        (activeHistoryIndex !== undefined && !isEditingLastOperation) ||
                        // case 3: if the current data frame being shown is a result of a failed codegen/execute
                        // we shouldn't be able to accept it
                        !!activeDataFrameHeader?.displayedDueToError ||
                        // case 4: make sure we actually have a preview to accept
                        !activeDataFrameHeader?.isPreview ||
                        // case 5: if the active arguments are the exact same as what was cached in a previous
                        // history step, then we shouldn't be able to accept it either
                        !!(
                            activeHistoryDataFrameHeader &&
                            deepEqual(
                                activeHistoryDataFrameHeader.historyItem.operationArgs,
                                activeDataFrameHeader.historyItem.operationArgs
                            ) &&
                            deepEqual(
                                activeHistoryDataFrameHeader.historyItem.gridCellEdits ?? [],
                                activeDataFrameHeader.historyItem.gridCellEdits ?? []
                            )
                        ),
                    onClick: () => {
                        void this.props.comms.operations.commitOperation();
                        this.props.telemetryLogger?.logEvent(WranglerTelemetryEvents.ApplyButtonClicked, {
                            properties: { how: "columnHeader" }
                        });
                    }
                },
                defaultRender: (props) => {
                    return (
                        <div
                            className="wrangler-column-header-button wrangler-column-header-accept-preview"
                            onClick={(e) => {
                                e.stopPropagation();
                                props.onClick();
                            }}
                        />
                    );
                },
                customRender: renderers?.onRenderCommitButton
            });
        }

        // we can show commit button for editing last step, but don't show the regular context menu
        if (isEditingLastOperation) {
            return null;
        }

        return renderCustom({
            props: {
                showHeaderContextMenu: (target) => {
                    onHeaderContextMenuShown?.("button");
                    gridContextMenuPlugin.showHeaderContextMenu(target, dataFrameColumnIndex);
                },
                sortAsc: gridSortPlugin.getSortColumn()?.index === dataFrameColumnIndex ? gridSortPlugin.getSortColumn()?.sortOrder : undefined,
                filter: gridFilterPlugin.getColumnFilter(dataFrameColumnIndex)
            },
            defaultRender: (props) => {
                const className = "wrangler-column-header-button wrangler-column-header-overflow-menu";
                return (
                    <div
                        className={className}
                        onClick={(e) => {
                            e.stopPropagation();
                            props.showHeaderContextMenu(e.target as any);
                        }}
                    />
                );
            },
            customRender: renderers?.onRenderOverflowMenuButton
        });
    }

    private handleKeyDown = (ev: React.KeyboardEvent) => {
        // Don't let RDG handle tab events. It will move focus through the entire grid,
        // which makes it difficult for keyboard users to navigate beyond the grid.
        if (ev.key === "Tab") {
            ev.stopPropagation();
        }
    };
}
