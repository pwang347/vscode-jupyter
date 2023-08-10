import { OperationsPanel } from "./operationsPanel";
import { fireEvent, render, RenderResult, act } from "@testing-library/react";
import React from "react";
import {
    DataImportOperationKey,
    IDataFrameHeader,
    IHistoryItem,
    IOperationView,
    IViewComms,
    OperationKey
} from "@dw/messaging";
import { IOperationsPanelRenderers } from "./types";

interface IOperationPanelTestProps {
    comms?: Partial<IViewComms>;
    operations?: IOperationView[];
    ref?: React.RefObject<OperationsPanel>;
    renderers?: IOperationsPanelRenderers;
    isPreviewDataFrame?: boolean;
    activeHistoryItem?: IHistoryItem;
    dataFrameHeader?: IDataFrameHeader;
}

describe("Operation panel", () => {
    function getComponentForProps(props: IOperationPanelTestProps) {
        const { comms, operations, ref, renderers, isPreviewDataFrame, activeHistoryItem, dataFrameHeader } = props;
        return (
            <OperationsPanel
                ref={ref}
                comms={comms ?? ({} as any)}
                dataFrameHeader={
                    dataFrameHeader ??
                    (isPreviewDataFrame
                        ? { isPreview: true, historyItem: {} as any }
                        : ({ historyItem: {} as any } as any))
                }
                operations={operations ?? []}
                gridCellEdits={[]}
                renderers={renderers}
                debouncePreviewTimeInMs={0}
                activeHistoryItem={activeHistoryItem}
                gridSelection={{ columns: [], rows: [], isEntireTableSelected: false }}
                enableEditLastAppliedOperation={false}
                enableAutomaticCodeExecutionForDescribeOp={false}
                historyItems={[]}
            />
        );
    }

    function renderOperationPanel(props: IOperationPanelTestProps, original?: RenderResult) {
        if (original) {
            original.rerender(getComponentForProps(props));
            return original;
        }
        const result = render(getComponentForProps(props));
        return result;
    }

    function getOperationPanelRootElement() {
        const operationPanelRootElement = document.querySelector(".wrangler-operations-panel-root");
        if (!operationPanelRootElement) {
            fail("Could not find operation panel root element");
        }
        return operationPanelRootElement;
    }

    it("should show list if no operation selected and vice versa", () => {
        const ref = React.createRef<OperationsPanel>();
        renderOperationPanel({
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async () => {}
                } as any
            }
        });
        const operationPanelElement = getOperationPanelRootElement();
        let listView = operationPanelElement.querySelector(".operation-panel-list-view");
        let formView = operationPanelElement.querySelector(".operation-panel-form-view");
        expect(listView).toBeTruthy();
        expect(formView).toBeFalsy();
        act(() => ref.current?.setOperation("drop"));
        listView = operationPanelElement.querySelector(".operation-panel-list-view");
        formView = operationPanelElement.querySelector(".operation-panel-form-view");
        expect(listView).toBeFalsy();
        expect(formView).toBeTruthy();
    });

    it("should not enable 'apply' button until valid preview is received", async () => {
        let operation: { operationKey: string; args: any } | undefined = undefined;
        const ref = React.createRef<OperationsPanel>();
        const props: IOperationPanelTestProps = {
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async (operationKey: string, args: any) => {
                        operation = { operationKey, args };
                    }
                } as any
            },
            renderers: {
                onRenderAcceptCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-apply-button" />;
                    } else {
                        return <div className="enabled-apply-button" />;
                    }
                }
            }
        };
        const operationPanelComponent = renderOperationPanel(props);
        const operationPanelElement = getOperationPanelRootElement();
        act(() => ref.current?.setOperation("drop"));
        let applyButtonDisabled = operationPanelElement.querySelector(".disabled-apply-button");
        let applyButtonEnabled = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonDisabled).toBeTruthy();
        expect(applyButtonEnabled).toBeFalsy();

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(operation).toBeTruthy();
        expect(operation).toMatchObject({ operationKey: "drop", args: {} });
        renderOperationPanel({ ...props, isPreviewDataFrame: true }, operationPanelComponent);

        applyButtonDisabled = operationPanelElement.querySelector(".disabled-apply-button");
        applyButtonEnabled = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonDisabled).toBeFalsy();
        expect(applyButtonEnabled).toBeTruthy();
    });

    it("should render the operation groups as expected", () => {
        renderOperationPanel({
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                },
                {
                    key: "sort",
                    name: "Sort column",
                    helpText: "Sorts a column",
                    args: [],
                    category: "Sorting stuff"
                },
                {
                    key: "dropna",
                    name: "Drop missing values in column",
                    helpText: "Drops missing values in column",
                    args: [],
                    category: "Dropping stuff"
                },
                {
                    key: "scale",
                    name: "Scale column",
                    helpText: "Scales a column",
                    args: [],
                    category: "Scaling stuff"
                },
                {
                    key: "sortdesc",
                    name: "Sort descending in column",
                    helpText: "Sorts a column in descending order",
                    args: [],
                    category: "Sorting stuff"
                }
            ],
            renderers: {
                onRenderOperationGroupList: (props) => {
                    return (
                        <div>
                            {props.groups.map((group) => {
                                return (
                                    <div key={group.groupLabel}>
                                        <div className="group-name">{group.groupLabel}</div>
                                        <div className="group-operations">
                                            {group.operations.map((operation) => operation.key).join(",")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            }
        });
        const operationPanelElement = getOperationPanelRootElement();
        const groupNames = Array.from(operationPanelElement.querySelectorAll(".group-name")).map(
            (node) => node.textContent
        );
        expect(groupNames).toMatchObject(["Dropping stuff", "Scaling stuff", "Sorting stuff"]);
        const groupOperations = Array.from(operationPanelElement.querySelectorAll(".group-operations")).map(
            (node) => node.textContent
        );
        expect(groupOperations).toMatchObject(["drop,dropna", "scale", "sort,sortdesc"]);
    });

    it("should filter with basic search", () => {
        renderOperationPanel({
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                },
                {
                    key: "sort",
                    name: "Sort column",
                    helpText: "Sorts a column",
                    args: [],
                    category: "Sorting stuff"
                },
                {
                    key: "dropna",
                    name: "Drop missing values in column",
                    helpText: "Drops missing values in column",
                    args: [],
                    category: "Dropping stuff"
                },
                {
                    key: "scale",
                    name: "Scale column",
                    helpText: "Scales a column",
                    args: [],
                    category: "Scaling stuff"
                },
                {
                    key: "sortdesc",
                    name: "Sort descending in column",
                    helpText: "Sorts a column in descending order",
                    args: [],
                    category: "Sorting stuff"
                }
            ],
            renderers: {
                onRenderOperationSearch: (props) => {
                    return (
                        <input
                            type="text"
                            className="operation-search"
                            onChange={(e) => {
                                props.onChange(e.target.value);
                            }}
                            value={props.value}
                        />
                    );
                },
                onRenderOperationGroupList: () => {
                    return <div className="operation-groups" />;
                },
                onRenderOperationList: (props) => {
                    return (
                        <div className="operation-list">
                            {props.operations.map((operation) => {
                                return (
                                    <div key={operation.key} className="operation">
                                        {operation.label}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            }
        });
        const operationPanelElement = getOperationPanelRootElement();
        const searchBar = operationPanelElement.querySelector(".operation-search") as HTMLInputElement;

        // empty search bar should still show operation groups
        fireEvent.change(searchBar, { target: { value: "" } });
        expect(searchBar).toBeTruthy();
        expect(operationPanelElement.querySelector(".operation-groups")).toBeTruthy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeFalsy();

        // exact match
        fireEvent.change(searchBar, { target: { value: "Drop column" } });
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeTruthy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject(["Drop column"]);

        // case-insensitive match
        fireEvent.change(searchBar, { target: { value: "DrOp COlUmN" } });
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeTruthy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject(["Drop column"]);

        // multiple matches in name
        fireEvent.change(searchBar, { target: { value: "Drop" } });
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeTruthy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject(["Drop column", "Drop missing values in column"]);

        // multiple matches in help text
        fireEvent.change(searchBar, { target: { value: "column" } });
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeTruthy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject([
            "Drop column",
            "Sort column",
            "Drop missing values in column",
            "Scale column",
            "Sort descending in column"
        ]);
    });

    it("should show basic information of a past cleaning step (not the first step)", () => {
        renderOperationPanel({
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            renderers: {
                onRenderOperationSearch: (props) => {
                    return (
                        <input
                            type="text"
                            className="operation-search"
                            onChange={(e) => {
                                props.onChange(e.target.value);
                            }}
                            value={props.value}
                        />
                    );
                },
                onRenderOperationGroupList: () => {
                    return <div className="operation-groups" />;
                },
                onRenderOperationList: (props) => {
                    return (
                        <div className="operation-list">
                            {props.operations.map((operation) => {
                                return (
                                    <div key={operation.key} className="operation">
                                        {operation.label}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            },
            activeHistoryItem: {
                index: 2,
                code: "drop bar",
                description: "Drop column 'bar'",
                variableName: "",
                operation: { key: "drop" },
                targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
            }
        });
        const operationPanelElement = getOperationPanelRootElement();

        const searchBar = operationPanelElement.querySelector(".operation-search") as HTMLInputElement;
        expect(searchBar).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeFalsy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject([]);

        const title = operationPanelElement.querySelector(
            ".wrangler-operations-panel-operation-title"
        ) as HTMLDivElement;
        expect(title.textContent).toBe("Drop column");
        const description = operationPanelElement.querySelector(
            ".wrangler-operations-panel-operation-description"
        ) as HTMLDivElement;
        expect(description.textContent).toBe("Drops a column");
    });

    it("should show basic information of the first cleaning step", () => {
        renderOperationPanel({
            operations: [
                {
                    key: "drop",
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            renderers: {
                onRenderOperationSearch: (props) => {
                    return (
                        <input
                            type="text"
                            className="operation-search"
                            onChange={(e) => {
                                props.onChange(e.target.value);
                            }}
                            value={props.value}
                        />
                    );
                },
                onRenderOperationGroupList: () => {
                    return <div className="operation-groups" />;
                },
                onRenderOperationList: (props) => {
                    return (
                        <div className="operation-list">
                            {props.operations.map((operation) => {
                                return (
                                    <div key={operation.key} className="operation">
                                        {operation.label}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
            },
            activeHistoryItem: {
                index: 0,
                code: "df = pd.read_csv(r'foo.csv')",
                description: "Loaded variable 'df' from URI",
                variableName: "",
                targetedColumns: [],
                operation: {
                    key: DataImportOperationKey.ReadCsv,
                    isDataImportOperation: true
                }
            }
        });
        const operationPanelElement = getOperationPanelRootElement();

        const searchBar = operationPanelElement.querySelector(".operation-search") as HTMLInputElement;
        expect(searchBar).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-groups")).toBeFalsy();
        expect(operationPanelElement.querySelector(".operation-list")).toBeFalsy();
        expect(
            Array.from(operationPanelElement.querySelectorAll(".operation")).map((node) => node.textContent)
        ).toMatchObject([]);

        const title = operationPanelElement.querySelector(
            ".wrangler-operations-panel-operation-title"
        ) as HTMLDivElement;
        expect(title.textContent).toBe("Imported data into Data Wrangler");
        const description = operationPanelElement.querySelector(
            ".wrangler-operations-panel-operation-description"
        ) as HTMLDivElement;
        expect(description.textContent).toBe("Loaded variable 'df' from URI");
    });

    it("should hide the action buttons for custom operations", () => {
        const ref = React.createRef<OperationsPanel>();
        renderOperationPanel({
            operations: [
                {
                    key: OperationKey.Drop,
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                },
                {
                    key: OperationKey.CustomOperation,
                    name: "Custom operation",
                    helpText: "Write some custom code",
                    args: [],
                    category: "Custom"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async () => {}
                } as any
            },
            renderers: {
                onRenderAcceptCodeButton: () => <div className="my-button" />,
                onRenderClearPreviewButton: () => <div className="my-button" />
            }
        });

        // we should render two buttons for other operations like Drop
        act(() => ref.current?.setOperation(OperationKey.Drop));
        let operationPanelElement = getOperationPanelRootElement();
        let buttons = operationPanelElement.querySelectorAll(".my-button");
        expect(buttons.length).toBe(2);

        // We should not render any buttons for custom operations
        act(() => ref.current?.setOperation(OperationKey.CustomOperation));
        operationPanelElement = getOperationPanelRootElement();
        buttons = operationPanelElement.querySelectorAll(".my-button");
        expect(buttons.length).toBe(0);
    });

    it("should show the correct states when in manual preview mode (code not generated)", async () => {
        let operation: { operationKey: string; args: any } | undefined = undefined;
        let codeExecutionWasSkipped: boolean | undefined = undefined;
        const ref = React.createRef<OperationsPanel>();
        const props: IOperationPanelTestProps = {
            operations: [
                {
                    key: OperationKey.DescribeYourOperation,
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async (
                        operationKey: string,
                        args: any,
                        _activeHistoryIndex?: number,
                        skipCodeExecution?: boolean
                    ) => {
                        codeExecutionWasSkipped = skipCodeExecution;
                        operation = { operationKey, args };
                    }
                } as any
            },
            renderers: {
                onRenderAcceptCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-apply-button" />;
                    } else {
                        return <div className="enabled-apply-button" />;
                    }
                },
                onRenderClearPreviewButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-discard-button" />;
                    } else {
                        return <div className="enabled-discard-button" />;
                    }
                },
                onRenderPreviewCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-preview-button" />;
                    } else {
                        return <div className="enabled-preview-button" />;
                    }
                }
            }
        };
        renderOperationPanel(props);
        const operationPanelElement = getOperationPanelRootElement();

        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Foo" }));

        // all buttons except discard disabled
        const applyButtonEnabled = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled).toBeFalsy();
        const discardButtonEnabled = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled).toBeTruthy();
        const previewButtonEnabled = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled).toBeFalsy();

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(operation).toEqual({
            args: { Prompt: "Foo" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);

        // we should skip any previews in this state
        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Bar" }));

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        // all buttons except discard disabled
        const applyButtonEnabled2 = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled2).toBeFalsy();
        const discardButtonEnabled2 = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled2).toBeTruthy();
        const previewButtonEnabled2 = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled2).toBeFalsy();

        expect(operation).toEqual({
            args: { Prompt: "Bar" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);
    });

    it("should show the correct states when in manual preview mode (code generated)", async () => {
        let operation: { operationKey: string; args: any } | undefined = undefined;
        let codeExecutionWasSkipped: boolean | undefined = undefined;
        const ref = React.createRef<OperationsPanel>();
        const props: IOperationPanelTestProps = {
            dataFrameHeader: {
                displayedDueToError: true,
                displayedDueToMissingArguments: true,
                codeGenPreviewHistoryItem: {
                    index: 2,
                    code: "drop foo",
                    description: "Drop the Foo column",
                    variableName: "",
                    operation: { key: OperationKey.DescribeYourOperation }
                } as any,
                historyItem: {} as any
            } as any,
            operations: [
                {
                    key: OperationKey.DescribeYourOperation,
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async (
                        operationKey: string,
                        args: any,
                        _activeHistoryIndex?: number,
                        skipCodeExecution?: boolean
                    ) => {
                        codeExecutionWasSkipped = skipCodeExecution;
                        operation = { operationKey, args };
                    }
                } as any
            },
            renderers: {
                onRenderAcceptCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-apply-button" />;
                    } else {
                        return <div className="enabled-apply-button" />;
                    }
                },
                onRenderClearPreviewButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-discard-button" />;
                    } else {
                        return <div className="enabled-discard-button" />;
                    }
                },
                onRenderPreviewCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-preview-button" />;
                    } else {
                        return <div className="enabled-preview-button" />;
                    }
                }
            }
        };
        renderOperationPanel(props);
        const operationPanelElement = getOperationPanelRootElement();

        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Foo" }));

        // all buttons except apply enabled
        const applyButtonEnabled = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled).toBeFalsy();
        const discardButtonEnabled = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled).toBeTruthy();
        const previewButtonEnabled = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled).toBeTruthy();

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(operation).toEqual({
            args: { Prompt: "Foo" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);

        // we should skip any previews in this state
        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Bar" }));

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        // all buttons except apply enabled
        const applyButtonEnabled2 = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled2).toBeFalsy();
        const discardButtonEnabled2 = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled2).toBeTruthy();
        const previewButtonEnabled2 = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled2).toBeTruthy();

        expect(operation).toEqual({
            args: { Prompt: "Bar" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);
    });

    it("should show the correct states when in manual preview mode (code previewed)", async () => {
        let operation: { operationKey: string; args: any } | undefined = undefined;
        let codeExecutionWasSkipped: boolean | undefined = undefined;
        const ref = React.createRef<OperationsPanel>();
        const props: IOperationPanelTestProps = {
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop foo",
                    description: "Drop the Foo column",
                    variableName: "",
                    operation: { key: OperationKey.DescribeYourOperation }
                } as any
            } as any,
            operations: [
                {
                    key: OperationKey.DescribeYourOperation,
                    name: "Drop column",
                    helpText: "Drops a column",
                    args: [],
                    category: "Dropping stuff"
                }
            ],
            ref,
            comms: {
                operations: {
                    previewOperation: async (
                        operationKey: string,
                        args: any,
                        _activeHistoryIndex?: number,
                        skipCodeExecution?: boolean
                    ) => {
                        codeExecutionWasSkipped = skipCodeExecution;
                        operation = { operationKey, args };
                    }
                } as any
            },
            renderers: {
                onRenderAcceptCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-apply-button" />;
                    } else {
                        return <div className="enabled-apply-button" />;
                    }
                },
                onRenderClearPreviewButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-discard-button" />;
                    } else {
                        return <div className="enabled-discard-button" />;
                    }
                },
                onRenderPreviewCodeButton: (props) => {
                    if (props.disabled) {
                        return <div className="disabled-preview-button" />;
                    } else {
                        return <div className="enabled-preview-button" />;
                    }
                }
            }
        };
        const operationPanel = renderOperationPanel(props);
        const operationPanelElement = getOperationPanelRootElement();

        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Foo" }));

        // force a rerender with a "new" dataframe - this is needed to get the apply button to enable
        renderOperationPanel({ ...props, dataFrameHeader: { ...props.dataFrameHeader } as any }, operationPanel);

        // all buttons except preview enabled
        const applyButtonEnabled = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled).toBeTruthy();
        const discardButtonEnabled = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled).toBeTruthy();
        const previewButtonEnabled = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled).toBeFalsy();

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(operation).toEqual({
            args: { Prompt: "Foo" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);

        // we should skip any previews in this state
        act(() => ref.current?.setOperation(OperationKey.DescribeYourOperation, { Prompt: "Bar" }));

        // force a rerender with a "new" dataframe - this is needed to get the apply button to enable
        renderOperationPanel({ ...props, dataFrameHeader: { ...props.dataFrameHeader } as any }, operationPanel);

        // we need to wait for the preview debounce
        await new Promise((resolve) => setTimeout(resolve, 100));

        // all buttons except preview enabled
        const applyButtonEnabled2 = operationPanelElement.querySelector(".enabled-apply-button");
        expect(applyButtonEnabled2).toBeTruthy();
        const discardButtonEnabled2 = operationPanelElement.querySelector(".enabled-discard-button");
        expect(discardButtonEnabled2).toBeTruthy();
        const previewButtonEnabled2 = operationPanelElement.querySelector(".enabled-preview-button");
        expect(previewButtonEnabled2).toBeFalsy();

        expect(operation).toEqual({
            args: { Prompt: "Bar" },
            operationKey: OperationKey.DescribeYourOperation
        });
        expect(codeExecutionWasSkipped).toBe(true);
    });
});
