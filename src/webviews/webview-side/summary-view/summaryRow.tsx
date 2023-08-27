// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FoldSectionItem, SummaryValueType, ISummaryRow } from "@dw/components";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import * as React from "react";

/**
 * Props for the summary row.
 */
interface ISummaryRowProps extends ISummaryRow {}

/**
 * A single summary row.
 */
export class SummaryRow extends React.PureComponent<ISummaryRowProps> {
    private iconRef = React.createRef<HTMLDivElement>();

    override render() {
        const { label, type, value, tooltip } = this.props;
        const content = (
            <div className="wrangler-summary-row-content">
                <div className="wrangler-summary-row-title">
                    {label}
                    {type === SummaryValueType.Warning && (
                        <div
                            ref={this.iconRef}
                            style={{
                                fontSize: 16,
                                alignSelf: "flex-end",
                                marginLeft: 6
                            }}
                            className="codicon codicon-warning wrangler-summary-warning-icon"
                        />
                    )}
                </div>
                <div className="wrangler-summary-secondary-text">{value}</div>
            </div>
        );
        return (
            <FoldSectionItem
                key={`summary-row-${label}`}
                aria-label={`${label} ${tooltip || ""}`}
                className="wrangler-summary-row-wrapper"
            >
                {tooltip ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <TooltipHost tooltipProps={{ targetElement: this.iconRef as any }} content={tooltip}>
                        {content}
                    </TooltipHost>
                ) : (
                    content
                )}
            </FoldSectionItem>
        );
    }
}
