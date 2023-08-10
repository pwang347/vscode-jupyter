import * as React from "react";
import debounce from "lodash.debounce";

import { IOperationsPanelProps, IOperationsPanelState } from "./types";
import { LocalizedStrings } from "../../localization";
import { renderOperationPanelArguments } from "./argsRenderer";
import { renderCustom } from "../../customRender";
import { OperationsListView } from "./operationsListView";
import {
    deepEqual,
    getDefaultArgs,
    IHistoryItem,
    isEditingLastAppliedOperation,
    isPreviewingUpdatesToLastAppliedOperation,
    OperationKey,
    WranglerTelemetryEvents
} from "@dw/messaging";

import "./operationsPanel.scss";

/**
 * Wrangler operations panel.
 */
export class OperationsPanel extends React.PureComponent<IOperationsPanelProps, IOperationsPanelState> {
    private skipPreviewForCachedGridCellEdit: boolean = false;

    state: IOperationsPanelState = {
        searchValue: "",
        selectedArgs: {},
        isWaitingForPreview: false
    };

    private shouldUseManualPreview = () => {
        return (
            this.state.selectedOperation?.key === OperationKey.DescribeYourOperation &&
            !this.props.enableAutomaticCodeExecutionForDescribeOp
        );
    };

    static getDerivedStateFromProps(props: IOperationsPanelProps): Partial<IOperationsPanelState> | null {
        const lastAppliedOperationHasUpdates = isPreviewingUpdatesToLastAppliedOperation({
            dataFrameHeader: props.dataFrameHeader,
            historyItemsLength: props.historyItems.length,
            enableEditLastAppliedOperation: props.enableEditLastAppliedOperation
        });
        if (props.activeHistoryDataFrameHeader && !lastAppliedOperationHasUpdates) {
            return {
                activeDataFrameHeader: props.activeHistoryDataFrameHeader
            };
        }
        return {
            activeDataFrameHeader: props.dataFrameHeader
        };
    }

    private setSearchValue = (value: string) => {
        this.setState({ searchValue: value });
    };

    private getLocalizedStrings() {
        const { locStrings } = this.props;
        return locStrings ?? LocalizedStrings.Operations;
    }

    /**
     * Override the panel state.
     */
    public setOperation(operationKey?: string, args?: any, skipPreview?: boolean) {
        const { operations, gridSelection } = this.props;
        const { activeDataFrameHeader } = this.state;
        if (!activeDataFrameHeader) {
            return;
        }

        // if the operation exists then we should select it and trigger a preview
        if (operationKey) {
            const operation = operations.find((operation) => operation.key === operationKey);
            if (operation) {
                this.setState({
                    selectedOperation: operation,
                    selectedArgs:
                        args ??
                        getDefaultArgs(
                            activeDataFrameHeader,
                            operation.args,
                            gridSelection.columns.map((c) => activeDataFrameHeader.columns[c.index])
                        )
                });

                if (!skipPreview) {
                    this.skipPreviewForCachedGridCellEdit = false;
                    this.previewOperation();
                } else {
                    this.skipPreviewForCachedGridCellEdit = true;
                }
                return;
            }
        }

        this.skipPreviewForCachedGridCellEdit = false;
        this.setState({
            selectedOperation: undefined,
            selectedArgs: {}
        });
    }

    /**
     * Sends the intent to update the operation preview.
     */
    private previewOperation = (isTriggeredByGridCellEdits?: boolean, force?: boolean) => {
        // don't allow committing until we're sure that it's a valid operation
        // don't debounce this since we want to make the disable state update as soon as values are updated
        this.setState({
            isWaitingForPreview: true
        });
        return this.previewOperationDebounced(isTriggeredByGridCellEdits, force);
    };

    private previewOperationDebounced = debounce((isTriggeredByGridCellEdits?: boolean, force?: boolean) => {
        const { comms, disabled, activeHistoryItem } = this.props;
        const { selectedOperation, selectedArgs } = this.state;

        if (disabled) {
            return;
        }

        // sanity check: we have an operation
        if (!selectedOperation) {
            return;
        }

        // we want to avoid the first preview when visiting old history steps
        if (isTriggeredByGridCellEdits && this.skipPreviewForCachedGridCellEdit) {
            this.skipPreviewForCachedGridCellEdit = false;
            return;
        }

        // preview the operation
        comms.operations.previewOperation(
            selectedOperation.key,
            selectedArgs,
            activeHistoryItem?.index,
            this.shouldUseManualPreview() && !force
        );
    }, this.props.debouncePreviewTimeInMs ?? 500);

    componentDidUpdate(prevProps: IOperationsPanelProps, prevState: IOperationsPanelState) {
        // if the edited grid state has changed, update the operation preview
        // and only trigger a new preview if we have grid cell edits
        if (
            prevProps.gridCellEdits !== this.props.gridCellEdits &&
            // we often need to reset the grid cell edit state, but don't trigger a new preview if we already
            // had an empty grid cell edit state
            (!(prevProps.gridCellEdits.length === 0 && this.props.gridCellEdits.length === 0) ||
                this.skipPreviewForCachedGridCellEdit) // if we planned to skip this, we should consume that intent anyways
        ) {
            this.previewOperation(true);
        }

        // clear the initial waiting state if we got a valid preview, also clear if we got generated but non-executed code
        if (
            (this.state.activeDataFrameHeader?.isPreview ||
                this.state.activeDataFrameHeader?.codeGenPreviewHistoryItem) &&
            this.state.activeDataFrameHeader !== prevState.activeDataFrameHeader
        ) {
            this.setState({
                isWaitingForPreview: false
            });
        }
    }

    /**
     * Renders the operation list view (no operation selected).
     */
    private renderOperationListView(locStrings: typeof LocalizedStrings.Operations) {
        const { renderers, operations, onOperationSelected, gridSelection } = this.props;
        const { activeDataFrameHeader, searchValue } = this.state;
        return (
            <OperationsListView
                locStrings={locStrings}
                searchValue={searchValue}
                setSearchValue={this.setSearchValue}
                operations={operations}
                updateOperation={(operation) => {
                    onOperationSelected?.(operation, !!searchValue);
                    if (!activeDataFrameHeader) {
                        return;
                    }
                    const defaultArgs = getDefaultArgs(
                        activeDataFrameHeader,
                        operation.args,
                        gridSelection.columns.map((c) => activeDataFrameHeader.columns[c.index])
                    );
                    this.setState({
                        selectedOperation: operation,
                        selectedArgs: defaultArgs
                    });
                    this.previewOperation();
                }}
                renderers={renderers}
            />
        );
    }

    /**
     * Renders the form associated with a selected operation.
     */
    private renderOperationFormView(locStrings: typeof LocalizedStrings.Operations, activeHistoryItem?: IHistoryItem) {
        const {
            dataFrameHeader,
            renderers,
            disableCommitAndRejectButtons,
            disablePreviewButton,
            disabled,
            historyItems,
            enableEditLastAppliedOperation,
            gridCellEdits
        } = this.props;
        const { searchValue, isWaitingForPreview, selectedArgs } = this.state;
        let operation = this.state.selectedOperation;

        // The form is editable if either we're on the latest preview or we're editing the latest committed step
        const isEditingPastItem = isEditingLastAppliedOperation({
            activeHistoryIndex: activeHistoryItem?.index,
            historyItemsLength: historyItems.length,
            enableEditLastAppliedOperation
        });
        const isEditable = !activeHistoryItem || isEditingPastItem;

        // If we're not editing the history item, the operation should come from the active history item
        // and not the current state of the panel
        if (!isEditingPastItem) {
            operation = activeHistoryItem?.operation
                ? this.props.operations.find((o) => o.key === activeHistoryItem.operation.key)!
                : this.state.selectedOperation;
        }

        if (activeHistoryItem?.index === 0) {
            // Fake operation for the initial state
            operation = {
                key: "initial",
                category: "initial",
                args: [],
                name: locStrings.InitialStateName,
                helpText: activeHistoryItem.description
            };
        }

        let renderBackLabel = locStrings.BackToAllOperationsButtonText;
        if (activeHistoryItem) {
            renderBackLabel = locStrings.BackToCurrentOperation;
        } else if (searchValue) {
            renderBackLabel = locStrings.BackToResultsButtonText;
        }

        return (
            <div className="operation-panel-form-view">
                <div className="wrangler-operations-panel-top-button-tray">
                    {renderCustom({
                        props: {
                            label: renderBackLabel,
                            onClick: () => {
                                if (!activeHistoryItem) {
                                    this.props.comms.operations.rejectOperation();
                                    this.setState({
                                        selectedOperation: undefined,
                                        selectedArgs: {}
                                    });
                                }
                                this.props.comms.ui.updateActiveHistoryIndex();
                                this.props.telemetryLogger?.logEvent(
                                    WranglerTelemetryEvents.BackToResultsButtonClicked
                                );
                            }
                        },
                        defaultRender: (props) => <button onClick={props.onClick}>{props.label}</button>,
                        customRender: renderers?.onRenderBackToResultsButton
                    })}
                </div>
                {operation && <h3 className="wrangler-operations-panel-operation-title">{operation.name}</h3>}
                <div className="wrangler-operations-panel-scrollable-form-container">
                    <div className="wrangler-operations-panel-form-content-region">
                        {operation && (
                            <p className="wrangler-operations-panel-operation-description">{operation.helpText}</p>
                        )}
                        {isEditable &&
                            renderOperationPanelArguments(
                                this.props,
                                this.state,
                                this.setState.bind(this) as any,
                                this.previewOperation.bind(this),
                                locStrings,
                                renderers
                            )}
                        {enableEditLastAppliedOperation && !isEditable && activeHistoryItem?.index !== 0 && (
                            <p className="wrangler-operations-panel-operation-non-editable-message">
                                {locStrings.EditingNotEnabledNotLatest}
                            </p>
                        )}
                    </div>
                </div>
                {operation && isEditable && operation.key !== OperationKey.CustomOperation && (
                    <div className="wrangler-operations-panel-button-area">
                        {renderCustom({
                            props: {
                                label: isEditingPastItem
                                    ? this.getLocalizedStrings().UpdateButtonText
                                    : this.getLocalizedStrings().AcceptCodeButtonText,
                                onClick: () => {
                                    this.props.comms.operations.commitOperation();
                                    this.setState({
                                        searchValue: "",
                                        selectedArgs: {},
                                        selectedOperation: undefined
                                    });
                                    this.props.telemetryLogger?.logEvent(WranglerTelemetryEvents.ApplyButtonClicked, {
                                        properties: { how: "operationPanel" }
                                    });
                                },
                                disabled:
                                    isWaitingForPreview ||
                                    // make sure we check `dataFrameHeader` instead of the active one here since we default to
                                    // showing the preview when the operation fails
                                    !!dataFrameHeader?.displayedDueToError ||
                                    !!dataFrameHeader?.codeGenPreviewHistoryItem ||
                                    !!disableCommitAndRejectButtons ||
                                    !!disabled ||
                                    !!(
                                        activeHistoryItem &&
                                        deepEqual(activeHistoryItem.operationArgs, selectedArgs) &&
                                        deepEqual(activeHistoryItem.gridCellEdits ?? [], gridCellEdits)
                                    )
                            },
                            defaultRender: (props) => {
                                return <button onClick={props.onClick}>{props.label}</button>;
                            },
                            customRender: renderers?.onRenderAcceptCodeButton
                        })}
                        {renderCustom({
                            props: {
                                label: isEditingPastItem
                                    ? this.getLocalizedStrings().CancelEditButtonText
                                    : this.getLocalizedStrings().ClearPreviewButtonText,
                                onClick: () => {
                                    this.props.comms.operations.rejectOperation();
                                    this.setState({
                                        searchValue: "",
                                        selectedOperation: undefined,
                                        selectedArgs: {}
                                    });
                                    this.props.telemetryLogger?.logEvent(WranglerTelemetryEvents.DiscardButtonClicked, {
                                        properties: { how: "operationPanel" }
                                    });
                                },
                                disabled: !!disableCommitAndRejectButtons || !!disabled
                            },
                            defaultRender: (props) => {
                                return <button onClick={props.onClick}>{props.label}</button>;
                            },
                            customRender: renderers?.onRenderClearPreviewButton
                        })}
                        {this.shouldUseManualPreview() &&
                            renderCustom({
                                props: {
                                    disabled:
                                        !!disablePreviewButton || !Boolean(dataFrameHeader?.codeGenPreviewHistoryItem),
                                    label: locStrings.PreviewCodeButtonText,
                                    onClick: () => {
                                        this.previewOperation(undefined, true);
                                        this.props.telemetryLogger?.logEvent(
                                            WranglerTelemetryEvents.CreatePreviewButtonClicked,
                                            {
                                                properties: { how: "operationPanel" }
                                            }
                                        );
                                    }
                                },
                                defaultRender: (props) => (
                                    <button disabled={props.disabled} onClick={props.onClick}>
                                        {props.label}
                                    </button>
                                ),
                                customRender: renderers?.onRenderPreviewCodeButton
                            })}
                    </div>
                )}
            </div>
        );
    }

    render() {
        const { selectedOperation } = this.state;
        const { activeHistoryItem } = this.props;
        const locStrings = this.getLocalizedStrings();
        const shouldRenderForm = Boolean(selectedOperation || activeHistoryItem);
        return (
            <div className="wrangler-operations-panel-root">
                {shouldRenderForm
                    ? this.renderOperationFormView(locStrings, activeHistoryItem)
                    : this.renderOperationListView(locStrings)}
            </div>
        );
    }
}
