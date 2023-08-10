import * as React from "react";
import debounce from "lodash.debounce";

import {
    IDataFrameHeader,
    IHistoryItem,
    IOperationView,
    IViewComms,
    ITelemetryLogger,
    WranglerTelemetryEvents,
    isEditingLastAppliedOperation,
    isPreviewingUpdatesToLastAppliedOperation,
    deepEqual,
    OperationKey,
    normalizeLineEndings,
    IRuntimeError
} from "@dw/messaging";
import { getCodeFromHistoryItem, getCodeFromHistoryItems } from "../codeHelpers";
import { IRenderFunction, renderCustom } from "../../customRender";
import { LocalizedStrings } from "../../localization";
import { PreviewStatus } from "./types";
import { getOperationLabel } from "./historyHelpers";

import "./codePreview.scss";

/**
 * State props for the wrangler preview panel.
 */
export interface ICodePreviewProps {
    historyItems: IHistoryItem[];
    activeHistoryIndex?: number;
    activeHistoryDataFrameHeader?: IDataFrameHeader;
    previewingAllTheCode: boolean;
    operations: IOperationView[];
    currentOperationKey?: string;
    currentOperationArgs?: any;
    dataFrameHeader?: IDataFrameHeader;
    lineCommentPrefix: string;
    comms: IViewComms;
    locStrings?: typeof LocalizedStrings.CodePreview;
    enableEditing?: boolean;
    renderers?: {
        onRenderPreviewEditor?: IRenderFunction<{
            value: string | undefined;
            editable: boolean;
            shouldFocus: boolean;
            onValueChanged: (value: string) => void;
        }>;
        onRenderStatusBar?: IRenderFunction<{
            label: string;
            status: PreviewStatus;
            error?: IRuntimeError;
        }>;
        onRenderAcceptPreviewButton?: IRenderFunction<{
            disabled: boolean;
            label: string;
            onClick: () => void;
        }>;
        onRenderRejectPreviewButton?: IRenderFunction<{
            disabled: boolean;
            label: string;
            onClick: () => void;
        }>;
        onRenderCreatePreviewButton?: IRenderFunction<{
            disabled: boolean;
            label: string;
            onClick: () => void;
        }>;
        onRenderReturnToCurrentStepButton?: IRenderFunction<{
            label: string;
            onClick: () => void;
        }>;
    };
    editDebounceTimeInMs?: number;
    disableCommitButton?: boolean;
    disablePreviewButton?: boolean;
    telemetryLogger?: ITelemetryLogger;
    enableEditLastAppliedOperation: boolean;
    enableAutomaticCodeExecutionForDescribeOp: boolean;
}

export interface ICodePreviewState {
    customCode?: string;
    editingHistoryIndex?: number;
    checkpointedOperationCode?: string;
    checkpointedOperationKey?: string;
    checkpointedOperationArgs?: any;
}

const initialState: ICodePreviewState = {
    customCode: undefined,
    editingHistoryIndex: undefined,
    checkpointedOperationCode: undefined,
    checkpointedOperationKey: undefined,
    checkpointedOperationArgs: undefined
};

/**
 * An individual history entry in the code snippets view.
 */
export class CodePreview extends React.Component<ICodePreviewProps, ICodePreviewState> {
    state = initialState;

    // We need to remember the previous code when the user starts writing custom code.
    lastRenderedCode: string | undefined;

    getLocalizedStrings() {
        const { locStrings } = this.props;
        return locStrings ?? LocalizedStrings.CodePreview;
    }

    private shouldUseManualPreview = () => {
        return (
            this.props.currentOperationKey === OperationKey.DescribeYourOperation &&
            !this.props.enableAutomaticCodeExecutionForDescribeOp
        );
    };

    onReturnToCurrentStep = () => {
        const { comms } = this.props;
        comms.ui.setPreviewAllTheCode(false);
    };

    onCommitOperation = () => {
        const { comms, telemetryLogger } = this.props;
        comms.operations.commitOperation();
        telemetryLogger?.logEvent(WranglerTelemetryEvents.ApplyButtonClicked, {
            properties: {
                how: "codePreviewPanel"
            }
        });
    };

    onRejectOperation = () => {
        const { comms, telemetryLogger } = this.props;
        comms.operations.rejectOperation();
        telemetryLogger?.logEvent(WranglerTelemetryEvents.DiscardButtonClicked, {
            properties: {
                how: "codePreviewPanel"
            }
        });
    };

    /**
     * In the case that we have code generated that isn't executed yet, we'll need
     * to provide the option to manually preview it.
     */
    onPreviewOperation = () => {
        const { comms, telemetryLogger, activeHistoryIndex } = this.props;
        const dataFrameHeaderToPreview = this.getDataFrameHeaderToPreview();
        if (!dataFrameHeaderToPreview?.codeGenPreviewHistoryItem?.operation) {
            return;
        }
        comms.operations.previewOperation(
            dataFrameHeaderToPreview.codeGenPreviewHistoryItem.operation.key,
            dataFrameHeaderToPreview.codeGenPreviewHistoryItem.operationArgs,
            activeHistoryIndex,
            false
        );
        telemetryLogger?.logEvent(WranglerTelemetryEvents.CreatePreviewButtonClicked, {
            properties: {
                how: "codePreviewPanel"
            }
        });
    };

    customOpDebounced = debounce(() => {
        if (this.state.customCode !== undefined) {
            const { comms } = this.props;
            if (this.state.customCode === this.state.checkpointedOperationCode && this.state.checkpointedOperationKey) {
                comms.ui.updateOperation(this.state.checkpointedOperationKey, this.state.checkpointedOperationArgs);
            } else {
                comms.ui.updateOperation(OperationKey.CustomOperation, {
                    CustomCode: this.state.customCode
                });
            }
        }
    }, this.props.editDebounceTimeInMs ?? 500);

    public updateValue(value: string | undefined) {
        this.setState({
            customCode: value
        });
    }

    onCodeEdited = (value: string) => {
        if (this.props.enableEditing === false) {
            return;
        }

        if (this.state.customCode === undefined && this.props.currentOperationKey !== OperationKey.CustomOperation) {
            // default to "" because for customCode in state it's always defined, and for operations like describe your operation
            // we can end up with an empty code block
            this.state.checkpointedOperationCode = this.lastRenderedCode ?? "";
            this.state.checkpointedOperationKey = this.props.currentOperationKey;
            this.state.checkpointedOperationArgs = this.props.currentOperationArgs;
        }

        // Intentionally don't call `setState()` here to avoid re-rendering,
        // since the editor will just maintain its current value.
        this.state.customCode = value;
        this.customOpDebounced();
    };

    static getDerivedStateFromProps(
        props: ICodePreviewProps,
        state: ICodePreviewState
    ): Partial<ICodePreviewState> | null {
        if (
            props.currentOperationKey !== OperationKey.CustomOperation ||
            props.activeHistoryIndex !== state.editingHistoryIndex
        ) {
            return { ...initialState, editingHistoryIndex: props.activeHistoryIndex };
        }
        return null;
    }

    private getStatusBarLabel(status: PreviewStatus): string {
        const locStrings = this.getLocalizedStrings();
        switch (status) {
            case PreviewStatus.CodeExecFailed:
                return locStrings.CodeExecutionFailedStatusLabel;
            case PreviewStatus.CodeGenFailed:
                return locStrings.CodeGenFailedStatusLabel;
            case PreviewStatus.NoOperation:
                return locStrings.NoOperationStatusLabel;
            case PreviewStatus.PreviewPaused:
                return locStrings.PreviewPausedStatusLabel;
            case PreviewStatus.PreviewUnchanged:
                return locStrings.PreviewUnchangedStatusLabel;
            case PreviewStatus.PreviewUnchangedCustomOperation:
                return locStrings.PreviewUnchangedCustomOperationStatusLabel;
            case PreviewStatus.Previewing:
                return locStrings.PreviewingStatusLabel;
            case PreviewStatus.MissingArguments:
                return locStrings.MissingArgumentsStatusLabel;
            case PreviewStatus.CodeGeneratedWaitingForExec:
                return locStrings.CodeGeneratedWaitingForExecStatusLabel;
        }
    }

    private getDataFrameHeaderToPreview() {
        const { dataFrameHeader, historyItems, enableEditLastAppliedOperation, activeHistoryDataFrameHeader } =
            this.props;
        const lastAppliedOperationHasUpdates = isPreviewingUpdatesToLastAppliedOperation({
            dataFrameHeader,
            historyItemsLength: historyItems.length,
            enableEditLastAppliedOperation
        });

        // for the code displayed in the editor, we prefer the active history item df over the latest df unless we're currently editing it
        const dataFrameHeaderToPreview =
            !lastAppliedOperationHasUpdates && activeHistoryDataFrameHeader
                ? activeHistoryDataFrameHeader
                : dataFrameHeader;

        return dataFrameHeaderToPreview;
    }

    render() {
        const {
            historyItems,
            activeHistoryIndex,
            activeHistoryDataFrameHeader,
            previewingAllTheCode,
            currentOperationKey,
            dataFrameHeader,
            lineCommentPrefix,
            renderers,
            disableCommitButton,
            disablePreviewButton,
            enableEditing,
            enableEditLastAppliedOperation
        } = this.props;
        const locStrings = this.getLocalizedStrings();

        const isEditingLastOperation = isEditingLastAppliedOperation({
            activeHistoryIndex,
            historyItemsLength: historyItems.length,
            enableEditLastAppliedOperation
        });
        const isEditable = !previewingAllTheCode && (activeHistoryIndex === undefined || isEditingLastOperation);

        // for the code displayed in the editor, we prefer the active history item df over the latest df unless we're currently editing it
        const dataFrameHeaderToPreview = this.getDataFrameHeaderToPreview();
        const previewHistoryItem = dataFrameHeaderToPreview?.isPreview ? dataFrameHeaderToPreview.historyItem : null;
        let currentHistoryItem = previewHistoryItem;
        let currentHistoryIndex = (activeHistoryIndex ? activeHistoryIndex : historyItems.length) + 1;

        if (activeHistoryIndex !== undefined && !previewHistoryItem && currentHistoryIndex !== activeHistoryIndex) {
            currentHistoryIndex = activeHistoryIndex + 1;
            currentHistoryItem = historyItems[activeHistoryIndex];
        }

        const isErrorState = dataFrameHeaderToPreview?.displayedDueToError ?? false;

        // If it's the first step, show a simple label.
        let label = locStrings.FirstStepLabel;

        if (previewingAllTheCode) {
            label = locStrings.PreviewingCodeForAllSteps;
        } else if (dataFrameHeaderToPreview?.codeGenPreviewHistoryItem) {
            label =
                getOperationLabel(
                    dataFrameHeaderToPreview?.error?.executedHistoryItem ||
                        dataFrameHeaderToPreview?.codeGenPreviewHistoryItem,
                    dataFrameHeaderToPreview?.codeGenPreviewHistoryItem.operation.key,
                    this.props.operations,
                    false
                ) || locStrings.NewOperationPlaceholder;
        } else if (currentHistoryItem?.index !== 0) {
            label =
                getOperationLabel(
                    dataFrameHeaderToPreview?.error?.executedHistoryItem || currentHistoryItem,
                    currentOperationKey,
                    this.props.operations,
                    false
                ) || locStrings.NewOperationPlaceholder;
        }

        const error = dataFrameHeaderToPreview?.error;
        let activeOperationKey = this.props.currentOperationKey;
        const rawCode = (() => {
            // Render special conditions only if the current step is the one being edited.
            if (isEditable) {
                if (this.state.customCode !== undefined) {
                    // If there is custom code, prefer to render that.
                    return this.state.customCode;
                } else if (error !== undefined && error.executedHistoryItem) {
                    // If we have a data frame created from an error, we should show the code for that.
                    // This can help debug issues with FlashFill, custom formulas
                    activeOperationKey = error.executedHistoryItem.operation.key;
                    return getCodeFromHistoryItem(error.executedHistoryItem, lineCommentPrefix);
                }
            }

            // If we have non-executed code that was generated, we should render that
            if (dataFrameHeaderToPreview?.codeGenPreviewHistoryItem) {
                activeOperationKey = dataFrameHeaderToPreview.codeGenPreviewHistoryItem.operation.key;
                return getCodeFromHistoryItem(dataFrameHeaderToPreview.codeGenPreviewHistoryItem, lineCommentPrefix);
            }

            // If we didn't meet any special conditions, default to rendering the selected step
            if (currentHistoryItem) {
                activeOperationKey = currentHistoryItem.operation.key;
                return getCodeFromHistoryItem(currentHistoryItem, lineCommentPrefix);
            }

            // If there is no current operation, render nothing.
            // Placeholder content should be shown instead.
            return undefined;
        })();
        const renderedCode = rawCode && normalizeLineEndings(rawCode);
        this.lastRenderedCode = renderedCode;

        const isEditorReadOnly = previewingAllTheCode || enableEditing === false || !isEditable;
        const previewEditor = renderCustom({
            props: {
                value: previewingAllTheCode
                    ? getCodeFromHistoryItems(
                          // include the preview history item if it exists
                          dataFrameHeader?.isPreview && dataFrameHeader?.historyItem.index === historyItems.length
                              ? historyItems.concat(dataFrameHeader?.historyItem)
                              : historyItems,
                          lineCommentPrefix
                      )
                    : renderedCode,
                editable: !isEditorReadOnly,
                shouldFocus: !isEditorReadOnly && activeOperationKey === OperationKey.CustomOperation,
                onValueChanged: this.onCodeEdited
            },
            defaultRender: (props) => (
                <textarea
                    style={{ minHeight: 100, marginTop: 12, width: "100%" }}
                    readOnly={!props.editable}
                    onChange={(e) => props.onValueChanged(e.target.value)}
                >
                    {props.value}
                </textarea>
            ),
            customRender: renderers?.onRenderPreviewEditor
        });

        let status: PreviewStatus = PreviewStatus.NoOperation;
        if (dataFrameHeaderToPreview?.codeGenPreviewHistoryItem) {
            status = PreviewStatus.CodeGeneratedWaitingForExec;
        } else if (activeHistoryIndex !== undefined && !isEditable) {
            status = PreviewStatus.PreviewPaused;
        } else if (isErrorState) {
            status = dataFrameHeaderToPreview?.displayedDueToMissingArguments
                ? PreviewStatus.MissingArguments
                : error?.executedHistoryItem
                ? PreviewStatus.CodeExecFailed
                : PreviewStatus.CodeGenFailed;
        } else if (previewHistoryItem) {
            if (dataFrameHeaderToPreview?.isPreviewUnchanged) {
                status =
                    currentOperationKey === OperationKey.CustomOperation
                        ? PreviewStatus.PreviewUnchangedCustomOperation
                        : PreviewStatus.PreviewUnchanged;
            } else {
                status = PreviewStatus.Previewing;
            }
        }

        return (
            <div className="wrangler-preview-main-container">
                <div className="wrangler-preview-operation-title">
                    <div className="wrangler-preview-operation-index">
                        {previewingAllTheCode ? null : currentHistoryIndex}
                    </div>
                    <div className="wrangler-preview-operation-label">{label}</div>
                </div>
                <div className="wrangler-preview-editor-container">
                    <div className={`wrangler-preview-editor-wrapper ${isEditable ? "" : "disabled"}`}>
                        {previewEditor}
                    </div>
                    <div className="wrangler-preview-status-bar">
                        {previewingAllTheCode ? (
                            <React.Fragment>
                                {locStrings.ShowingCode} {locStrings.ReadOnlyStatusBarSuffix}&nbsp;(
                                {renderCustom({
                                    props: {
                                        label: locStrings.ReturnToCurrentStepButtonText,
                                        onClick: this.onReturnToCurrentStep
                                    },
                                    defaultRender: (props) => <button onClick={props.onClick}>{props.label}</button>,
                                    customRender: renderers?.onRenderReturnToCurrentStepButton
                                })}
                                )
                            </React.Fragment>
                        ) : (
                            renderCustom({
                                props: {
                                    label:
                                        this.getStatusBarLabel(status) +
                                        `${isEditable ? "" : " " + locStrings.ReadOnlyStatusBarSuffix}`,
                                    status,
                                    error
                                },
                                defaultRender: ({ label }) => <span>{label}</span>,
                                customRender: renderers?.onRenderStatusBar
                            })
                        )}
                    </div>
                </div>
                <div className="wrangler-preview-actions-container">
                    {previewingAllTheCode ? null : (
                        <React.Fragment>
                            {renderCustom({
                                props: {
                                    // we disable in the following cases:
                                    disabled:
                                        // case 1: commit button is disabled from the host
                                        disableCommitButton ||
                                        disablePreviewButton ||
                                        // case 2: we're viewing a past step but it's not editable
                                        (activeHistoryIndex !== undefined && !isEditingLastOperation) ||
                                        // case 3: if the current data frame being shown is a result of a failed codegen/execute
                                        // we shouldn't be able to accept it
                                        !!dataFrameHeaderToPreview?.displayedDueToError ||
                                        // case 4: make sure we actually have a preview to accept
                                        !dataFrameHeaderToPreview?.isPreview ||
                                        // case 5: if the active arguments are the exact same as what was cached in a previous
                                        // history step, then we shouldn't be able to accept it either
                                        !!(
                                            activeHistoryDataFrameHeader &&
                                            deepEqual(
                                                activeHistoryDataFrameHeader.historyItem.operationArgs,
                                                dataFrameHeaderToPreview.historyItem.operationArgs
                                            ) &&
                                            deepEqual(
                                                activeHistoryDataFrameHeader.historyItem.gridCellEdits ?? [],
                                                dataFrameHeaderToPreview.historyItem.gridCellEdits ?? []
                                            )
                                        ),
                                    label: isEditingLastOperation
                                        ? locStrings.UpdateButtonText
                                        : locStrings.ApplyPreviewButtonText,
                                    onClick: this.onCommitOperation
                                },
                                defaultRender: (props) => (
                                    <button disabled={props.disabled} onClick={props.onClick}>
                                        {props.label}
                                    </button>
                                ),
                                customRender: renderers?.onRenderAcceptPreviewButton
                            })}
                            {renderCustom({
                                props: {
                                    disabled:
                                        disableCommitButton ||
                                        (activeHistoryIndex !== undefined && !isEditingLastOperation) ||
                                        // We don't need to wait for a preview to complete before being able to discard. We just need to have an operation selected.
                                        !currentOperationKey,
                                    label: isEditingLastOperation
                                        ? locStrings.CancelEditButtonText
                                        : locStrings.DiscardPreviewButtonText,
                                    onClick: this.onRejectOperation
                                },
                                defaultRender: (props) => (
                                    <button disabled={props.disabled} onClick={props.onClick}>
                                        {props.label}
                                    </button>
                                ),
                                customRender: renderers?.onRenderRejectPreviewButton
                            })}
                            {this.shouldUseManualPreview() &&
                                renderCustom({
                                    props: {
                                        disabled:
                                            disablePreviewButton ||
                                            !Boolean(dataFrameHeaderToPreview?.codeGenPreviewHistoryItem),
                                        label: locStrings.CreatePreviewButtonText,
                                        onClick: this.onPreviewOperation
                                    },
                                    defaultRender: (props) => (
                                        <button disabled={props.disabled} onClick={props.onClick}>
                                            {props.label}
                                        </button>
                                    ),
                                    customRender: renderers?.onRenderCreatePreviewButton
                                })}
                        </React.Fragment>
                    )}
                </div>
            </div>
        );
    }
}
