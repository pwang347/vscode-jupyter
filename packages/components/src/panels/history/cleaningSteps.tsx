import * as React from "react";
import scrollIntoView from "scroll-into-view-if-needed";
import { IHistoryItem, IDataFrameHeader, IOperationView, formatString } from "@dw/messaging";
import { IRenderFunction, renderCustom } from "../../customRender";
import { LocalizedStrings } from "../../localization";

import "./cleaningSteps.scss";
import { getOperationLabel } from "./historyHelpers";

export interface ICleaningStepsProps {
    previewingAllTheCode?: boolean;
    activeHistoryIndex?: number;
    historyItems: IHistoryItem[];
    operations: IOperationView[];
    currentOperationKey?: string;
    dataFrameHeader?: IDataFrameHeader;
    lineCommentPrefix: string;
    locStrings?: typeof LocalizedStrings.CleaningSteps;
    undoLastStep: () => void;
    updateActiveHistoryIndex?: (index?: number) => void;
    setPreviewAllTheCode?: () => void;
    allowPreviewingAllTheCode: boolean;
    disableDeleteButton: boolean;
    cleaningStepProps?: React.HTMLAttributes<HTMLDivElement> & { [key: `data-${string}`]: any };
    renderers?: {
        onRenderCleaningStepsList?: IRenderFunction<{
            children: React.ReactNode;
        }>;
        onRenderDeleteButton?: IRenderFunction<{
            disabled: boolean;
            tooltip: string;
            onClick: () => void;
        }>;
        onRenderViewAllTheCodeIcon?: IRenderFunction<{
            tooltip: string;
        }>;
    };
}

export class CleaningSteps extends React.PureComponent<ICleaningStepsProps> {
    private ref = React.createRef<HTMLDivElement>();

    getLocalizedStrings() {
        const { locStrings } = this.props;
        return locStrings ?? LocalizedStrings.CleaningSteps;
    }

    componentDidUpdate(prevProps: ICleaningStepsProps) {
        if (
            prevProps.historyItems.length !== this.props.historyItems.length ||
            prevProps.activeHistoryIndex !== this.props.activeHistoryIndex
        ) {
            const items = this.ref.current?.querySelectorAll(".wrangler-cleaning-steps-container") ?? [];
            const index = this.props.activeHistoryIndex ?? items.length - 1;
            if (index < 0 || index >= items.length) {
                return;
            }
            scrollIntoView(items[index], {
                scrollMode: "if-needed"
            });
        }
    }

    // null item is used for the "new operation" item, since there is no history item associated with it.
    renderHistoryItem(
        item: IHistoryItem | null,
        index: number,
        isPreview: boolean,
        defaultOperationKey: string | undefined
    ) {
        const {
            historyItems,
            activeHistoryIndex,
            dataFrameHeader,
            operations,
            disableDeleteButton,
            renderers,
            cleaningStepProps,
            undoLastStep,
            updateActiveHistoryIndex,
            previewingAllTheCode
        } = this.props;

        const locStrings = this.getLocalizedStrings();

        const label = getOperationLabel(item, defaultOperationKey, operations) || locStrings.NewOperationPlaceholder;
        const tooltip = item?.description ?? label;
        const totalHistoryItems = historyItems.length;

        // Item can be deleted if it is not a preview, is the last item in the list, and is not the first item (import).
        const isDeletable =
            !dataFrameHeader?.isPreview && item === historyItems[totalHistoryItems - 1] && item !== historyItems[0];

        const targetCount = item?.targetedColumns?.length ?? 0;
        const targetsLabel =
            targetCount == 0
                ? ""
                : targetCount == 1
                ? `'${item!.targetedColumns[0].name}'`
                : formatString(locStrings.TargetedColumnsCountLabel, targetCount);

        const activeIndexIsPreview = activeHistoryIndex === undefined;
        const itemIsPending = item?.index === totalHistoryItems && activeIndexIsPreview;

        // The item is active if it is the current pending operation or if it is a past operation.
        const isActive = !previewingAllTheCode && (itemIsPending || activeHistoryIndex === item?.index);

        // The items after the active item should look different.
        const isAfterActive =
            activeHistoryIndex !== undefined && (item?.index === undefined || item?.index > activeHistoryIndex);

        return (
            <div
                key={index}
                role="listitem"
                aria-current={isActive ? "step" : undefined}
                {...cleaningStepProps}
                className={`wrangler-cleaning-steps-container ${isActive ? "active" : ""} ${
                    // The item is in preview if it is the current pending operation and the active index is undefined.
                    isPreview || itemIsPending ? "preview" : ""
                } ${isAfterActive ? "after-active" : ""} ${updateActiveHistoryIndex ? "" : "no-cursor"}`}
                onClick={() => {
                    if (
                        item?.index !== activeHistoryIndex ||
                        (previewingAllTheCode && activeHistoryIndex === undefined)
                    ) {
                        return (
                            updateActiveHistoryIndex &&
                            (item ? updateActiveHistoryIndex(item.index) : updateActiveHistoryIndex())
                        );
                    }
                }}
            >
                <div className="wrangler-cleaning-steps-number">{index}</div>
                <div className="wrangler-cleaning-steps-label" title={tooltip}>
                    <span>
                        {label}
                        <span className="wrangler-cleaning-steps-targets">{targetsLabel}</span>
                    </span>
                </div>
                {isDeletable && (
                    <div className="wrangler-cleaning-steps-actions">
                        {renderCustom({
                            props: {
                                disabled: disableDeleteButton,
                                tooltip: locStrings.DeleteCleaningStepTooltip,
                                onClick: undoLastStep
                            },
                            defaultRender: (props) => (
                                <button onClick={props.onClick} disabled={props.disabled}>
                                    {props.tooltip}
                                </button>
                            ),
                            customRender: renderers?.onRenderDeleteButton
                        })}
                    </div>
                )}
            </div>
        );
    }

    renderViewAllCodeButton() {
        const locStrings = this.getLocalizedStrings();

        const { allowPreviewingAllTheCode, previewingAllTheCode, setPreviewAllTheCode, renderers } = this.props;

        if (!allowPreviewingAllTheCode || !setPreviewAllTheCode) {
            return null;
        }

        return (
            <div
                key="view-all-code"
                role="button"
                aria-pressed={previewingAllTheCode}
                tabIndex={0}
                className={`wrangler-cleaning-steps-container fixed-to-bottom ${previewingAllTheCode ? "active" : ""}`}
                onClick={() => {
                    setPreviewAllTheCode();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setPreviewAllTheCode();
                    }
                }}
            >
                <div className="wrangler-cleaning-steps-label" title={locStrings.PreviewCodeForAllSteps}>
                    {renderCustom({
                        props: {
                            tooltip: locStrings.PreviewCodeForAllSteps
                        },
                        defaultRender: () => null,
                        customRender: renderers?.onRenderViewAllTheCodeIcon
                    })}
                    {locStrings.PreviewCodeForAllSteps}
                </div>
            </div>
        );
    }

    render() {
        const { historyItems, dataFrameHeader, currentOperationKey } = this.props;
        // note: historyItems.length is the count of committed items, so the current step would have an index matching that
        // given that it is 1 higher than the previous history item
        const isPreviewForCurrentStep =
            dataFrameHeader?.isPreview && dataFrameHeader.historyItem.index === historyItems.length;

        // If there was an error, we want to display the error on the current step
        const displayErrorOnCurrentStep =
            dataFrameHeader?.displayedDueToError &&
            dataFrameHeader.error?.executedHistoryItem?.index === historyItems.length;

        return (
            <div ref={this.ref} className="wrangler-cleaning-steps-root-container">
                <div className="wrangler-cleaning-steps-list-container" role="list">
                    {renderCustom({
                        props: {
                            children: [
                                ...historyItems.map((item, index) => {
                                    // Whether there was an error or not,
                                    // If the active preview df has an index in the previously committed step list
                                    // then we should render the history item there instead of what was previously committed.
                                    const renderedItem =
                                        dataFrameHeader?.isPreview && dataFrameHeader.historyItem.index === item.index
                                            ? dataFrameHeader?.error?.executedHistoryItem || dataFrameHeader.historyItem
                                            : item;
                                    return this.renderHistoryItem(renderedItem, index + 1, false, undefined);
                                }),
                                this.renderHistoryItem(
                                    // both when there's an error and when there's no error,
                                    // show "New operation" if we do have a preview, but it's for a previous step
                                    isPreviewForCurrentStep || displayErrorOnCurrentStep
                                        ? dataFrameHeader?.error?.executedHistoryItem || dataFrameHeader!.historyItem
                                        : null,
                                    historyItems.length + 1,
                                    true,
                                    // If in preview for current step, show the current operation key
                                    // If an error occurs in the last step, show the current operation key
                                    // Otherwise, show the default ("New operation")
                                    isPreviewForCurrentStep || displayErrorOnCurrentStep
                                        ? currentOperationKey
                                        : undefined
                                )
                            ]
                        },
                        defaultRender: (props) => <>{props.children}</>,
                        customRender: this.props.renderers?.onRenderCleaningStepsList
                    })}
                </div>
                {this.renderViewAllCodeButton()}
            </div>
        );
    }
}
