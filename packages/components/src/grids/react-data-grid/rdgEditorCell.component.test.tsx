import * as React from "react";
import { render } from "@testing-library/react";
import { IReactDataGridEditorCellProps, ReactDataGridEditorCell } from "./rdgEditorCell";
import { LocalizedStrings } from "../../localization";

const editorValueClassName = "editor-value";
const editorValueSelector = `.${editorValueClassName}`;

describe("<ReactDataGridEditorCell>", () => {
    function renderEditorCell(props: Partial<IReactDataGridEditorCellProps>) {
        render(
            <ReactDataGridEditorCell
                onClose={() => {}}
                onRowChange={() => {}}
                row={{} as any}
                column={{} as any}
                comms={{} as any}
                // Index column isn't editable, so we can safely cast this
                dataFrameColumn={{ index: 0 } as any}
                gridColumnIndex={0}
                gridRowIndex={0}
                gridCellEdits={[]}
                disabled={false}
                cellProps={{} as any}
                performGridEdit={() => {}}
                localizedStrings={LocalizedStrings.Grid}
                renderers={{
                    onRenderTextEditorCell: (props) => {
                        return <div className={editorValueClassName}>{props.value}</div>;
                    }
                }}
                {...props}
            />
        );
    }

    describe("Editor value", () => {
        it("should default to the row data", () => {
            renderEditorCell({
                row: {
                    data: ["foo"],
                    index: 0
                }
            });
            const editorValue = document.querySelector(editorValueSelector);
            expect(editorValue?.textContent).toBe("foo");
        });

        it("should use editor data if available", () => {
            renderEditorCell({
                row: {
                    data: ["foo"],
                    index: 0
                },
                cellProps: {
                    cellEdit: {
                        row: 0,
                        column: 0,
                        value: "bar"
                    }
                } as any
            });
            const editorValue = document.querySelector(editorValueSelector);
            expect(editorValue?.textContent).toBe("bar");
        });

        it("should be blank if autofilled and there was an error", () => {
            renderEditorCell({
                row: {
                    data: ["foo"],
                    index: 0
                },
                cellProps: {
                    isAutoFilled: true,
                    displayedDueToError: true
                } as any
            });
            const editorValue = document.querySelector(editorValueSelector);
            expect(editorValue?.textContent).toBe("");
        });
    });
});
