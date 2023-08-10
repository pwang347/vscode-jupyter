import React from "react";
import { fireEvent, render, RenderResult } from "@testing-library/react";

import { DataImportOperationKey, IDataFrameHeader, IOperationView } from "@dw/messaging";

import { CleaningSteps, ICleaningStepsProps } from "./cleaningSteps";
import { LocalizedStrings } from "../../localization";

interface ICleaningStepsTestProps extends Omit<ICleaningStepsProps, "dataFrameHeader"> {
    ref?: React.RefObject<CleaningSteps>;
    dataFrameHeader?: Partial<IDataFrameHeader>;
}

const operations: IOperationView[] = [
    {
        key: "drop",
        name: "Drop column",
        helpText: "Drops a column",
        args: [],
        category: "Dropping stuff"
    }
];

describe("Operation panel", () => {
    function getComponentForProps(props: ICleaningStepsTestProps) {
        const { ref, dataFrameHeader, ...otherProps } = props;
        return (
            <CleaningSteps ref={ref} dataFrameHeader={(dataFrameHeader || {}) as IDataFrameHeader} {...otherProps} />
        );
    }

    function renderCleaningSteps(props: ICleaningStepsTestProps, original?: RenderResult) {
        if (original) {
            original.rerender(getComponentForProps(props));
            return original;
        }
        const result = render(getComponentForProps(props));
        return result;
    }

    function getCleaningStepsRootElement() {
        const cleaningStepsRootElement = document.querySelector(".wrangler-cleaning-steps-root-container");
        if (!cleaningStepsRootElement) {
            fail("Could not find cleaning steps root element");
        }
        return cleaningStepsRootElement;
    }

    it("Should show 'New operation' if no operation is selected", () => {
        const ref = React.createRef<CleaningSteps>();
        renderCleaningSteps({
            operations,
            ref,
            disableDeleteButton: false,
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
            lineCommentPrefix: "",
            undoLastStep: () => {},
            activeHistoryIndex: undefined,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(2);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2${LocalizedStrings.CleaningSteps.NewOperationPlaceholder}`);
    });

    it("On error, should show the title of the selected operation", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                displayedDueToError: true,
                historyItem: {
                    index: 0
                } as any,
                error: {
                    executedHistoryItem: {
                        index: 1,
                        code: "drop foo",
                        description: "Drop column 'foo'",
                        variableName: "",
                        operation: { key: "drop" },
                        targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                    } as any
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: undefined,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(2);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column`);
    });

    it("On error, show New operation if we do have a preview, but it's for a previous step", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                displayedDueToError: true,
                historyItem: {
                    index: 1,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 1 }]
                } as any,
                error: {
                    executedHistoryItem: {
                        index: 1,
                        code: "drop baz",
                        description: "Drop column 'baz'",
                        variableName: "",
                        operation: { key: "drop" },
                        targetedColumns: [{ key: "'baz'", name: "baz", index: 1 }]
                    } as any
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: 1,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'baz'`);
        expect(steps[2].textContent).toContain(`3New operation`);
    });

    it("When there is no error, show New operation if we do have a preview, but it's for a previous step", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 1,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 1 }]
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: 1,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'bar'`);
        expect(steps[2].textContent).toContain(`3New operation`);
    });

    it("If in preview for current step, show the current operation key", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: undefined,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'foo'`);
        expect(steps[2].textContent).toContain(`3Drop column'bar'`);
    });

    it("If an error occurs in the last step, show the current operation key", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                displayedDueToError: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                } as any,
                error: {
                    executedHistoryItem: {
                        index: 2,
                        code: "drop baz",
                        description: "Drop column 'baz'",
                        variableName: "",
                        operation: { key: "drop" },
                        targetedColumns: [{ key: "'baz'", name: "baz", index: 3 }]
                    } as any
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: undefined,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'foo'`);
        expect(steps[2].textContent).toContain(`3Drop column'baz'`);
    });

    it("Render the label of the df history item if the active preview df has an index in the previously committed step list", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: 1,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'foo'`);
        expect(steps[2].textContent).toContain(`3New operation`);
    });

    it("On error, render the label of the df history item if the active preview df has an index in the previously committed step list", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 1,
                    code: "drop foo",
                    description: "Drop column 'foo'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                } as any,
                error: {
                    executedHistoryItem: {
                        index: 1,
                        code: "drop bar",
                        description: "Drop column 'bar'",
                        variableName: "",
                        operation: { key: "drop" },
                        targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                    } as any
                } as any
            },
            currentOperationKey: "drop",
            activeHistoryIndex: 1,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'bar'`);
        expect(steps[2].textContent).toContain(`3New operation`);
    });

    it("Should show targeted columns for current and past steps", () => {
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            },
            currentOperationKey: "drop",
            activeHistoryIndex: undefined,
            updateActiveHistoryIndex: () => {},
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);
        expect(steps[0].textContent).toContain("1Import data");
        expect(steps[1].textContent).toContain(`2Drop column'foo'`);
        expect(steps[2].textContent).toContain(`3Drop column'bar'`);
    });

    it("Should allow navigating to past cleaning steps", () => {
        let activeHistoryIndex: number | undefined;
        renderCleaningSteps({
            operations,
            disableDeleteButton: false,
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
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'foo'", name: "foo", index: 1 }]
                }
            ],
            lineCommentPrefix: "",
            undoLastStep: () => {},
            dataFrameHeader: {
                isPreview: true,
                historyItem: {
                    index: 2,
                    code: "drop bar",
                    description: "Drop column 'bar'",
                    variableName: "",
                    operation: { key: "drop" },
                    targetedColumns: [{ key: "'bar'", name: "bar", index: 2 }]
                }
            },
            currentOperationKey: "drop",
            activeHistoryIndex,
            updateActiveHistoryIndex: (index?: number) => {
                activeHistoryIndex = index;
            },
            allowPreviewingAllTheCode: true
        });
        const cleaningStepsElement = getCleaningStepsRootElement();
        const steps = cleaningStepsElement.querySelectorAll(".wrangler-cleaning-steps-container");
        expect(steps.length).toBe(3);

        for (let i = 0; i < steps.length; i++) {
            fireEvent.click(steps[i]);
            expect(activeHistoryIndex).toBe(i);
        }
    });
});
