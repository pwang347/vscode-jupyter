// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from "react";
import { WranglerPostOffice } from '../data-explorer/wranglerPostOffice';
import { DataWranglerMessages } from '../../extension-side/dataviewer/dataWranglerMessages';
import { FoldSection, SummaryPanel } from '@dw/components';
import { IDataFrame, ISelection } from '@dw/messaging';
import { SummaryRow } from './summaryRow';
import { IMessageHandler } from '../react-common/postOffice';

interface ISummaryPanelState {
    dataFrame: IDataFrame | undefined,
    selection: ISelection
}

import "@dw/components/dist/index.css";
import "./summaryViewPanel.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SummaryViewPanel extends React.PureComponent<any, ISummaryPanelState> implements IMessageHandler {
    private postOffice: WranglerPostOffice = new WranglerPostOffice();

    override state: ISummaryPanelState = {
        dataFrame: undefined,
        selection: {
            columns: [],
            rows: [],
            isEntireTableSelected: false
        }
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMessage(type: string, payload?: any): boolean {
        console.log("@@@@GOT MESSAGE", type);
        switch (type) {
            case DataWranglerMessages.Host.InitializeData:
                this.setState({
                    dataFrame: this.postOffice.linkDataFrame(payload),
                });
                break;
            case DataWranglerMessages.Host.SetDataFrame:
                this.setState({
                    dataFrame: this.postOffice.linkDataFrame(payload),
                })
                break;
                case DataWranglerMessages.Host.SetGridSelection:
                    this.setState({
                        selection: payload,
                    })
                    break;
        }
        return true;
    }

    override componentDidMount() {
        this.postOffice.addHandler(this);
        this.postOffice.sendMessage<DataWranglerMessages.IWebviewMapping>(DataWranglerMessages.Webview.Started);
    }

    localizeNumber = (n: number, maxDecimalCount?: number, minDecimalCount?: number) => {
        // TODO@DW: localize
        return n.toLocaleString("en-us", {
            minimumFractionDigits: minDecimalCount,
            maximumFractionDigits: maxDecimalCount
        });
    };

    override render() {
        const {
            dataFrame,
            selection
        } = this.state;

        return (
                <SummaryPanel
                    dataFrame={dataFrame}
                    selection={selection}
                    historyItems={[]}
                    enableViewingPastCodeStepsWithData={false}
                    enableEditLastAppliedOperation={false}
                    localizeNumber={this.localizeNumber}
                    renderers={{
                        onRenderSummaryRow: (props) => {
                            return <SummaryRow {...props} />;
                        },
                        onRenderRowsSubGroup: (props) => {
                            return (
                                <FoldSection
                                    startFolded={true}
                                    title={props.label}
                                    secondaryTitle={props.rowsCountLabel}
                                >
                                    {props.groupContent}
                                </FoldSection>
                            );
                        },
                        onRenderMissingValuesSubGroup: (props) => {
                            return (
                                <FoldSection
                                    startFolded={true}
                                    title={props.label}
                                    secondaryTitle={props.totalMissingValuesLabel}
                                >
                                    {props.groupContent}
                                </FoldSection>
                            );
                        },
                        onRenderCategoricalSubGroup: (props) => {
                            /* TODO@DW: localize */
                            return <FoldSection title="Statistics">{props.groupContent}</FoldSection>;
                        },
                        onRenderStatisticsSubGroup: (props) => {
                            return (
                                <>
                                    {/*
                                    TODO@DW: consider making these sections collapsible. There's currently no built-in component for this.
                                    See https://github.com/microsoft/vscode-webview-ui-toolkit/issues/260
                                */}
                                    {/* TODO@DW: localize */}
                                    <FoldSection title="Statistics">{props.groupContent}</FoldSection>
                                    <FoldSection title="Advanced Statistics">{props.advancedGroupContent}</FoldSection>
                                </>
                            );
                        }
                    }}
                />
        );
    }
}
