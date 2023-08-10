import * as React from "react";
import { render } from "@testing-library/react";
import { LocalizedStrings } from "../../localization";
import { IReactDataGridViewCellProps, ReactDataGridViewCell } from "./rdgViewCell";

const cellValueSelector = `.wrangler-grid-cell-view-content`;

describe("<ReactDataGridViewCell>", () => {
    function renderViewCell(props: Partial<IReactDataGridViewCellProps>) {
        render(
            <ReactDataGridViewCell
                dataFrameIndexColumnName=""
                gridContextMenuPlugin={{} as any}
                gridSelectionPlugin={{} as any}
                onRowChange={() => {}}
                row={{} as any}
                column={{} as any}
                tabIndex={0}
                rootRef={{} as any}
                // Index column isn't editable, so we can safely cast this
                dataFrameColumn={{ index: 0 } as any}
                gridColumnIndex={0}
                gridRowIndex={0}
                isCellSelected={false}
                cellProps={{} as any}
                localizedStrings={LocalizedStrings.Grid}
                {...props}
            />
        );
    }

    describe("Cell value", () => {
        it("should default to the row data", () => {
            renderViewCell({
                row: {
                    data: ["foo"],
                    index: 0
                }
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("foo");
        });

        it("should stringify non-string data", () => {
            renderViewCell({
                row: {
                    data: [1],
                    index: 0
                }
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("1");
        });

        it("should show missing value label if data is null", () => {
            renderViewCell({
                row: {
                    data: [null],
                    index: 0
                }
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("Missing value");
        });

        it("should use editor data if available", () => {
            renderViewCell({
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
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("bar");
        });

        it("should be blank if autofilled and there was an error", () => {
            renderViewCell({
                row: {
                    data: ["foo"],
                    index: 0
                },
                cellProps: {
                    isAutoFilled: true,
                    displayedDueToError: true
                } as any
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("");
        });

        it("should show placeholder if cell is editable, selected and empty", () => {
            renderViewCell({
                row: {
                    data: [""],
                    index: 0
                },
                gridSelectionPlugin: {
                    isCellSelected: () => true
                } as any,
                cellProps: {
                    isEditable: true
                } as any
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("Enter an example");
        });

        it("should show blank if it's a padding cell", () => {
            renderViewCell({
                row: {
                    data: ["foo"],
                    index: 0
                },
                cellProps: {
                    isPaddingCell: true
                } as any
            });
            const cellValue = document.querySelector(cellValueSelector);
            expect(cellValue?.textContent).toBe("");
        });
    });
});
