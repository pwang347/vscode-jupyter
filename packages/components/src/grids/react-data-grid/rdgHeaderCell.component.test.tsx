import * as React from "react";
import { render } from "@testing-library/react";
import { IReactDataGridHeaderCellProps, ReactDataGridHeaderCell } from "./rdgHeaderCell";

describe("<ReactDataGridHeaderCell>", () => {
    function renderHeaderCell(props: Partial<IReactDataGridHeaderCellProps>) {
        render(
            <ReactDataGridHeaderCell
                comms={{} as any}
                gridContextMenuPlugin={{} as any}
                gridSelectionPlugin={{} as any}
                selection={{
                    columns: [],
                    rows: [],
                    isEntireTableSelected: false
                }}
                dataFrameColumnIndex={0}
                disabled={false}
                disableInteractions={false}
                disableCommitButton={false}
                tabIndex={0}
                isEditingLastOperation={false}
                lastAppliedOperationHasUpdates={false}
                sortDirection={"ASC"}
                priority={0}
                onSort={() => {}}
                rootRef={{} as any}
                column={{} as any}
                // Index column isn't editable, so we can safely cast this
                dataFrameColumn={{ index: 0 } as any}
                isCellSelected={false}
                {...props}
            />
        );
    }

    describe("Context menu button", () => {
        const contextMenuSelector = ".overflow-button";

        it("should render by default", () => {
            renderHeaderCell({
                dataFrameColumnIndex: 1,
                renderers: {
                    onRenderOverflowMenuButton: () => {
                        return <div className="overflow-button" />;
                    }
                }
            });
            const headerButton = document.querySelector(contextMenuSelector);
            expect(!!headerButton).toBe(true);
        });

        it("should not render if editing last operation", () => {
            renderHeaderCell({
                dataFrameColumnIndex: 1,
                renderers: {
                    onRenderOverflowMenuButton: () => {
                        return <div className="overflow-button" />;
                    }
                },
                isEditingLastOperation: true
            });
            const headerButton = document.querySelector(contextMenuSelector);
            expect(!!headerButton).toBe(false);
        });

        it("should not render if interactions disabled", () => {
            renderHeaderCell({
                dataFrameColumnIndex: 1,
                renderers: {
                    onRenderOverflowMenuButton: () => {
                        return <div className="overflow-button" />;
                    }
                },
                disableInteractions: true
            });
            const headerButton = document.querySelector(contextMenuSelector);
            expect(!!headerButton).toBe(false);
        });
    });
});
