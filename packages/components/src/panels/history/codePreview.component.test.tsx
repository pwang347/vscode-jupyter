import React from "react";
import { render, RenderResult } from "@testing-library/react";

import { DataImportOperationKey, IDataFrameHeader, IOperationView, OperationKey } from "@dw/messaging";

import { CodePreview, ICodePreviewProps } from "./codePreview";
import { LocalizedStrings } from "../../localization";

interface ICodePreviewTestProps extends Omit<ICodePreviewProps, "dataFrameHeader"> {
    ref?: React.RefObject<CodePreview>;
    dataFrameHeader?: Partial<IDataFrameHeader>;
}

const operations: IOperationView[] = [
    {
        key: OperationKey.Drop,
        name: "Drop column",
        helpText: "Drops a column",
        args: [],
        category: "Dropping stuff"
    },
    {
        key: OperationKey.DescribeYourOperation,
        name: "Describe your operation",
        helpText: "Generate code using a natural language prompt.",
        args: [],
        category: "Describing stuff"
    }
];

describe("Code preview panel", () => {
    function getComponentForProps(props: ICodePreviewTestProps) {
        const { ref, dataFrameHeader, ...otherProps } = props;
        return <CodePreview ref={ref} dataFrameHeader={(dataFrameHeader || {}) as IDataFrameHeader} {...otherProps} />;
    }

    function renderCodePreview(props: ICodePreviewTestProps, original?: RenderResult) {
        if (original) {
            original.rerender(getComponentForProps(props));
            return original;
        }
        const result = render(getComponentForProps(props));
        return result;
    }

    function getCodePreviewRootElement() {
        const codePreviewRootElement = document.querySelector(".wrangler-preview-main-container");
        if (!codePreviewRootElement) {
            fail("Could not find code preview root element");
        }
        return codePreviewRootElement;
    }

    it("No operation selected", () => {
        const ref = React.createRef<CodePreview>();
        renderCodePreview({
            operations,
            ref,
            disableCommitButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: true,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("2New operation");
        expect(editor?.textContent).toBe("");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.NoOperationStatusLabel);
        expect(buttons.length).toBe(2);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(true);
    });

    it("Error in operation", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                displayedDueToError: true,
                historyItem: {} as any
            },
            currentOperationKey: OperationKey.Drop,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: true,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("2Drop column");
        expect(editor?.textContent).toBe("");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.CodeGenFailedStatusLabel);
        expect(buttons.length).toBe(2);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(false);
    });

    it("Previewing operation", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            },
            currentOperationKey: OperationKey.Drop,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: true,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("3Drop column");
        expect(editor?.textContent).toBe("#Drop column 'bar'\ndrop bar");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.PreviewingStatusLabel);
        expect(buttons.length).toBe(2);
        expect(buttons[0].disabled).toBe(false);
        expect(buttons[1].disabled).toBe(false);
    });

    it("Viewing a past cleaning step", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            activeHistoryIndex: 1,
            historyItems: [
                {
                    index: 0,
                    code: "df = pd.read_csv(r'foo.csv')",
                    description: "Imported data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                },
                {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            },
            currentOperationKey: OperationKey.Drop,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: true,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("2Drop column");
        expect(editor?.textContent).toBe("#Drop column 'bar'\ndrop bar");
        expect(status?.textContent).toBe(
            `${LocalizedStrings.CodePreview.PreviewPausedStatusLabel} ${LocalizedStrings.CodePreview.ReadOnlyStatusBarSuffix}`
        );
        expect(buttons.length).toBe(2);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(true);
    });

    it("Viewing the first cleaning step (load dataFrame)", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            activeHistoryIndex: 0,
            historyItems: [
                {
                    index: 0,
                    code: "df = pd.read_csv(r'foo.csv')",
                    description: "Imported data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                },
                {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 0,
                    code: "df = pd.read_csv(r'foo.csv')",
                    description: "Imported data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                }
            },
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: true,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("4Imported data");
        expect(editor?.textContent).toBe("#Imported data\ndf = pd.read_csv(r'foo.csv')");
        expect(status?.textContent).toBe(
            `${LocalizedStrings.CodePreview.PreviewPausedStatusLabel} ${LocalizedStrings.CodePreview.ReadOnlyStatusBarSuffix}`
        );
        expect(buttons.length).toBe(2);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(true);
    });

    it("should show the correct states when in manual preview mode (code not generated)", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            disablePreviewButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                displayedDueToError: true,
                displayedDueToMissingArguments: true,
                historyItem: {} as any
            },
            currentOperationKey: OperationKey.DescribeYourOperation,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: false,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("3Describe your operation");
        expect(editor?.textContent).toBe("");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.MissingArgumentsStatusLabel);
        expect(buttons.length).toBe(3);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(false);
        expect(buttons[2].disabled).toBe(true);
    });

    it("should show the correct states when in manual preview mode (code generated)", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            disablePreviewButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
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
            },
            currentOperationKey: OperationKey.DescribeYourOperation,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: false,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("3Describe your operation");
        expect(editor?.textContent).toBe("#Drop the Foo column\ndrop foo");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.CodeGeneratedWaitingForExecStatusLabel);
        expect(buttons.length).toBe(3);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(false);
        expect(buttons[2].disabled).toBe(false);
    });

    it("should show the correct states when in manual preview mode (code previewed)", () => {
        renderCodePreview({
            operations,
            disableCommitButton: false,
            disablePreviewButton: false,
            activeHistoryIndex: undefined,
            historyItems: [
                {
                    index: 0,
                    code: "",
                    description: "Import data",
                    variableName: "",
                    targetedColumns: [],
                    operation: {
                        key: DataImportOperationKey.ReadCsv,
                        isDataImportOperation: true
                    }
                },
                {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: OperationKey.Drop },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "#",
            comms: {} as any,
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop foo",
                    description: "Drop the Foo column",
                    variableName: "",
                    operation: { key: OperationKey.DescribeYourOperation }
                } as any
            },
            currentOperationKey: OperationKey.DescribeYourOperation,
            enableEditLastAppliedOperation: true,
            enableAutomaticCodeExecutionForDescribeOp: false,
            previewingAllTheCode: false
        });
        const codePreviewElement = getCodePreviewRootElement();
        const title = codePreviewElement.querySelector(".wrangler-preview-operation-title");
        const editor = codePreviewElement.querySelector(".wrangler-preview-editor-wrapper");
        const status = codePreviewElement.querySelector(".wrangler-preview-status-bar");
        const buttons = codePreviewElement.querySelectorAll<HTMLButtonElement>(
            ".wrangler-preview-actions-container button"
        );
        expect(title?.textContent).toBe("3Describe your operation");
        expect(editor?.textContent).toBe("#Drop the Foo column\ndrop foo");
        expect(status?.textContent).toBe(LocalizedStrings.CodePreview.PreviewingStatusLabel);
        expect(buttons.length).toBe(3);
        expect(buttons[0].disabled).toBe(false);
        expect(buttons[1].disabled).toBe(false);
        expect(buttons[2].disabled).toBe(true);
    });
});
