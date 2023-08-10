import * as React from "react";
import { ReactDataGrid } from "./reactDataGrid";
import { render, fireEvent, act } from "@testing-library/react";
import { LocalizedStrings } from "../../localization";
import { AsyncTask, IDataFrame, IViewComms } from "@dw/messaging";
import { mockComms, mockDataFrame, mockRows } from "./testUtils";

describe("React data grid", () => {
    // test overrides
    HTMLCanvasElement.prototype.getContext = () => {
        return {
            font: "",
            measureText: (str: string) => str.length * 12
        } as any;
    };
    Element.prototype.scrollIntoView = jest.fn();

    // test helpers
    function renderGrid(
        comms: IViewComms,
        dataFrame: IDataFrame,
        options: { ref?: React.RefObject<ReactDataGrid>; disableFetching?: boolean } = {}
    ) {
        const { ref, disableFetching } = options;
        const result = render(
            <ReactDataGrid
                locale=""
                ref={ref}
                comms={comms}
                operations={[]}
                operationContextMenu={[]}
                gridCellEdits={[]}
                localizedStrings={LocalizedStrings.Grid}
                visualizationLocalizedStrings={LocalizedStrings.Visualization}
                disableVirtualization={true}
                disableFetching={disableFetching}
                historyItems={[]}
                enableEditLastAppliedOperation={true}
                renderers={{
                    onRenderCellContextMenu: () => {
                        return <div data-automation-id="cell-context-menu" />;
                    }
                }}
            />
        );
        result.rerender(
            <ReactDataGrid
                locale=""
                ref={ref}
                comms={comms}
                operations={[]}
                operationContextMenu={[]}
                gridCellEdits={[]}
                localizedStrings={LocalizedStrings.Grid}
                visualizationLocalizedStrings={LocalizedStrings.Visualization}
                dataFrame={dataFrame}
                disableVirtualization={true}
                disableFetching={disableFetching}
                historyItems={[]}
                enableEditLastAppliedOperation={true}
                renderers={{
                    onRenderCellContextMenu: () => {
                        return <div data-automation-id="cell-context-menu" />;
                    }
                }}
            />
        );
        return result;
    }

    function getGridElement() {
        const gridElement = document.querySelector(".rdg");
        if (!gridElement) {
            fail("Could not find grid");
        }
        return gridElement;
    }

    function getHeaderTexts(gridElement: Element) {
        const headerRow = gridElement.querySelector(".rdg-header-row");
        if (!headerRow) {
            fail("Could not find header row");
        }
        const headerTexts = Array.from(headerRow.querySelectorAll('div[role="columnheader"]')).map(
            (node) => node.textContent
        );
        return headerTexts;
    }

    // tests
    it("should render a table with data", () => {
        renderGrid(mockComms, mockDataFrame);
        const gridElement = getGridElement();
        const headerTexts = getHeaderTexts(gridElement);
        expect(headerTexts).toEqual([
            "Index",
            "AMissing:0 (0%)Unique:0 (0%)0Unique values",
            "BMissing:0 (0%)Unique:0 (0%)0Unique values"
        ]);

        const rows = Array.from(gridElement.querySelectorAll(".rdg-row"));
        expect(rows.length === 3);

        const [firstRow, secondRow, thirdRow] = rows;
        const firstRowCellValues = Array.from(firstRow.querySelectorAll('div[role="gridcell"]')).map(
            (node) => node.textContent
        );

        expect(firstRowCellValues).toEqual(["0", "foo", "0"]);

        const secondRowCellValues = Array.from(secondRow.querySelectorAll('div[role="gridcell"]')).map(
            (node) => node.textContent
        );

        expect(secondRowCellValues).toEqual(["1", "bar", "0"]);

        const thirdRowCellValues = Array.from(thirdRow.querySelectorAll('div[role="gridcell"]')).map(
            (node) => node.textContent
        );

        expect(thirdRowCellValues).toEqual(["2", "hello", "0"]);
    });

    it("should be able to select grid cells with mouse, keyboard and programmatically", async () => {
        const mockUpdateSelection = jest.fn();
        const comms: IViewComms = {
            ui: {
                updateSelection: mockUpdateSelection
            }
        } as any;
        const ref = React.createRef<ReactDataGrid>();
        renderGrid(comms, mockDataFrame, { ref });

        let rows = Array.from(document.querySelectorAll(".rdg-row"));
        expect(rows.length).toBe(3);

        let [firstRow, secondRow, thirdRow] = rows;
        let firstRowCells = firstRow.querySelectorAll('div[role="gridcell"]');
        expect(firstRowCells.length).toBe(3);
        let secondRowCells = secondRow.querySelectorAll('div[role="gridcell"]');
        expect(secondRowCells.length).toBe(3);
        let thirdRowCells = thirdRow.querySelectorAll('div[role="gridcell"]');
        expect(thirdRowCells.length).toBe(3);

        // State #1 (start)
        // | 0 | foo   |
        // | 1 | bar   |
        // | 2 | hello |
        expect(firstRow.className).not.toContain("wrangler-grid-row-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        fireEvent.click(secondRowCells[1]);

        // State #2 (after clicking 'bar')
        // | 0 | foo     |
        // [ 1 |[ bar   ]]
        // | 2 | hello   |
        expect(firstRow.className).not.toContain("wrangler-grid-row-selected");
        expect(secondRow.className).toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("true");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        expect(mockUpdateSelection).toHaveBeenCalledWith({
            activeCell: {
                column: {
                    index: 1,
                    key: "'A'",
                    name: "A"
                },
                row: {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            },
            columns: [],
            rows: [
                {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            ],
            isEntireTableSelected: false
        });

        mockUpdateSelection.mockClear();

        fireEvent.keyDown(secondRowCells[1], { key: "ArrowLeft", code: 37 });

        // State #3 (after pressing left arrow key)
        // | 0 | foo   |
        // [[ 1 ]| bar ]
        // | 2 | hello |
        expect(firstRow.className).not.toContain("wrangler-grid-row-selected");
        expect(secondRow.className).toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("true");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        expect(mockUpdateSelection).toHaveBeenCalledWith({
            activeCell: {
                column: {
                    index: 0,
                    key: "'Index'",
                    name: "Index"
                },
                row: {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            },
            columns: [],
            rows: [
                {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            ],
            isEntireTableSelected: false
        });

        mockUpdateSelection.mockClear();

        fireEvent.keyDown(secondRowCells[0], { key: "ArrowUp", code: 38 });

        // State #4 (after pressing up arrow key)
        // [[ 0 ]| foo   ]
        // | 1   | bar   |
        // | 2   | hello |
        expect(firstRow.className).toContain("wrangler-grid-row-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("true");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        expect(mockUpdateSelection).toHaveBeenCalledWith({
            activeCell: {
                column: {
                    index: 0,
                    key: "'Index'",
                    name: "Index"
                },
                row: {
                    dataframeIndex: 0,
                    gridIndex: 0
                }
            },
            columns: [],
            rows: [
                {
                    dataframeIndex: 0,
                    gridIndex: 0
                }
            ],
            isEntireTableSelected: false
        });

        mockUpdateSelection.mockClear();

        // note: to fire our specific on-click event, we need to access our nested listener
        fireEvent.click(secondRowCells[0].querySelector(".wrangler-grid-cell-view-content")!, {
            ctrlKey: true
        });

        // we need to refetch the elements again because the grid gets re-rendered
        rows = Array.from(document.querySelectorAll(".rdg-row"));
        expect(rows.length).toBe(3);
        [firstRow, secondRow, thirdRow] = rows;
        firstRowCells = firstRow.querySelectorAll('div[role="gridcell"]');
        expect(firstRowCells.length).toBe(3);
        secondRowCells = secondRow.querySelectorAll('div[role="gridcell"]');
        expect(secondRowCells.length).toBe(3);
        thirdRowCells = thirdRow.querySelectorAll('div[role="gridcell"]');
        expect(thirdRowCells.length).toBe(3);

        // State #5 (after ctrl-clicking '1')
        // [ 0   | foo   ]
        // [[ 1 ]| bar   ]
        // | 2   | hello |
        expect(firstRow.className).not.toContain("wrangler-grid-row-selected");
        expect(secondRow.className).toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("true");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        expect(mockUpdateSelection).toHaveBeenCalledWith({
            activeCell: {
                column: {
                    index: 0,
                    key: "'Index'",
                    name: "Index"
                },
                row: {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            },
            columns: [],
            rows: [
                {
                    dataframeIndex: 0,
                    gridIndex: 0
                },
                {
                    dataframeIndex: 1,
                    gridIndex: 1
                }
            ],
            isEntireTableSelected: false
        });

        mockUpdateSelection.mockClear();

        // note: to fire our specific on-click event, we need to access our nested listener
        fireEvent.click(thirdRowCells[1].querySelector(".wrangler-grid-cell-view-content")!, {
            shiftKey: true
        });

        // we need to refetch the elements again because the grid gets re-rendered
        rows = Array.from(document.querySelectorAll(".rdg-row"));
        expect(rows.length).toBe(3);
        [firstRow, secondRow, thirdRow] = rows;
        firstRowCells = firstRow.querySelectorAll('div[role="gridcell"]');
        expect(firstRowCells.length).toBe(3);
        secondRowCells = secondRow.querySelectorAll('div[role="gridcell"]');
        expect(secondRowCells.length).toBe(3);
        thirdRowCells = thirdRow.querySelectorAll('div[role="gridcell"]');
        expect(thirdRowCells.length).toBe(3);

        // State #6 (after shift-clicking 'hello')
        // [ 0 | foo     ]
        // [ 1 | bar     ]
        // [ 2 |[ hello ]]
        expect(firstRow.className).not.toContain("wrangler-grid-row-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).toContain("wrangler-grid-row-selected");
        expect(firstRow.className).toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("true");

        expect(mockUpdateSelection).toHaveBeenCalledWith({
            activeCell: {
                column: {
                    index: 1,
                    key: "'A'",
                    name: "A"
                },
                row: {
                    dataframeIndex: 2,
                    gridIndex: 2
                }
            },
            columns: [],
            rows: [
                {
                    dataframeIndex: 0,
                    gridIndex: 0
                },
                {
                    dataframeIndex: 1,
                    gridIndex: 1
                },
                {
                    dataframeIndex: 2,
                    gridIndex: 2
                }
            ],
            isEntireTableSelected: false
        });
        mockUpdateSelection.mockClear();

        act(() => {
            ref.current?.updateGridSelection({
                columns: [],
                rows: [
                    {
                        dataframeIndex: 0,
                        gridIndex: 0
                    }
                ],
                isEntireTableSelected: false
            });
        });

        // we need to refetch the elements again because the grid gets re-rendered
        rows = Array.from(document.querySelectorAll(".rdg-row"));
        expect(rows.length).toBe(3);
        [firstRow, secondRow, thirdRow] = rows;
        firstRowCells = firstRow.querySelectorAll('div[role="gridcell"]');
        expect(firstRowCells.length).toBe(3);
        secondRowCells = secondRow.querySelectorAll('div[role="gridcell"]');
        expect(secondRowCells.length).toBe(3);
        thirdRowCells = thirdRow.querySelectorAll('div[role="gridcell"]');
        expect(thirdRowCells.length).toBe(3);

        // State #7 (programmatic update to select the first row)
        // [ 0 |[ foo ]]
        // | 1 | bar   |
        // | 2 | hello |
        expect(firstRow.className).toContain("wrangler-grid-row-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-selected");
        expect(firstRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(secondRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(thirdRow.className).not.toContain("wrangler-grid-row-multi-selected");
        expect(firstRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(firstRowCells[1].getAttribute("aria-selected")).toEqual("true");
        expect(secondRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(secondRowCells[1].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[0].getAttribute("aria-selected")).toEqual("false");
        expect(thirdRowCells[1].getAttribute("aria-selected")).toEqual("false");

        // we don't call the update when it came from an external source
        expect(mockUpdateSelection).toHaveBeenCalledTimes(0);
    });

    it("should be able to multiselect grid header cells", async () => {
        const mockUpdateSelection = jest.fn();
        const comms: IViewComms = {
            ui: {
                updateSelection: mockUpdateSelection
            }
        } as any;
        const ref = React.createRef<ReactDataGrid>();
        renderGrid(comms, mockDataFrame, { ref });

        const headerRow = document.querySelector(".rdg-header-row");
        expect(headerRow).toBeTruthy();

        const headerRowCells = headerRow!.querySelectorAll(".wrangler-grid-header-cell");
        expect(headerRowCells.length).toBe(3);

        const rows = Array.from(document.querySelectorAll(".rdg-row"));
        expect(rows.length).toBe(3);

        const [firstRow, secondRow, thirdRow] = rows;
        const firstRowCells = firstRow.querySelectorAll('div[role="gridcell"]');
        expect(firstRowCells.length).toBe(3);
        const secondRowCells = secondRow.querySelectorAll('div[role="gridcell"]');
        expect(secondRowCells.length).toBe(3);
        const thirdRowCells = thirdRow.querySelectorAll('div[role="gridcell"]');
        expect(thirdRowCells.length).toBe(3);

        // State #1 (start)
        // | Index | A     | B |
        // |-------|-------|---|
        // | 0     | foo   | 0 |
        // | 1     | bar   | 0 |
        // | 2     | hello | 0 |

        expect(headerRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(headerRowCells[1].className).not.toContain("wrangler-grid-column-selected");
        expect(headerRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[1].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[1].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[1].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[2].className).not.toContain("wrangler-grid-column-selected");

        fireEvent.click(headerRowCells[1]);

        // State #2 (after clicking 'A')
        // | Index [[ A   ]] B |
        // |-------[-------]---|
        // | 0     [ foo   ] 0 |
        // | 1     [ bar   ] 0 |
        // | 2     [ hello ] 0 |

        expect(headerRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(headerRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(headerRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[0].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[2].className).not.toContain("wrangler-grid-column-selected");

        fireEvent.click(headerRowCells[0], {
            ctrlKey: true
        });

        // State #2 (after ctrl+clicking 'Index')
        // [[ Index ]][ A     ] B |
        // [---------][-------]---|
        // [ 0       ][ foo   ] 0 |
        // [ 1       ][ bar   ] 0 |
        // [ 2       ][ hello ] 0 |

        expect(headerRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(headerRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(headerRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(firstRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(secondRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[2].className).not.toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[2].className).not.toContain("wrangler-grid-column-selected");

        fireEvent.click(headerRowCells[2], {
            shiftKey: true
        });

        // State #2 (after shift+clicking 'B')
        // [  Index  ][ A     ][[ B ]]
        // [---------][-------][-----]
        // [ 0       ][ foo   ][ 0   ]
        // [ 1       ][ bar   ][ 0   ]
        // [ 2       ][ hello ][ 0   ]

        expect(headerRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(headerRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(headerRowCells[2].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(firstRowCells[2].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(secondRowCells[2].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[0].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[1].className).toContain("wrangler-grid-column-selected");
        expect(thirdRowCells[2].className).toContain("wrangler-grid-column-selected");
    });

    it("should be able to open the context menu", async () => {
        const mockUpdateSelection = jest.fn();
        const comms: IViewComms = {
            ui: {
                updateSelection: mockUpdateSelection
            }
        } as any;
        renderGrid(comms, mockDataFrame);
        const gridElement = getGridElement();
        const firstCell = gridElement.querySelector('div[role="gridcell"]') as HTMLDivElement;
        expect(firstCell).toBeTruthy();

        fireEvent.contextMenu(firstCell.querySelector(".wrangler-grid-cell-view-content")!);

        const contextMenu = document.querySelector('[data-automation-id="cell-context-menu"]');
        expect(contextMenu).toBeTruthy();
    });

    it("should allow fetching more data when scrolling to the end", async () => {
        const mockUpdateSelection = jest.fn();
        const comms: IViewComms = {
            ui: {
                updateSelection: mockUpdateSelection
            }
        } as any;

        const testMockRows = [...mockRows];
        const testMockDataFrame = {
            ...mockDataFrame,
            rowCount: 4
        };

        let resolve: (value?: any) => void;
        const prepareResolve = new Promise((_resolve) => {
            resolve = _resolve;
        });

        testMockDataFrame.loadRows = () => {
            if (testMockRows.length < 4) {
                testMockRows.push({
                    data: [testMockRows.length - 1, "hello"],
                    index: testMockRows.length - 1
                });
                resolve();
            }
            return AsyncTask.resolve(testMockRows);
        };

        renderGrid(comms, testMockDataFrame);
        const gridElement = getGridElement();

        fireEvent.scroll(gridElement, {
            currentTarget: {
                scrollHeight: 1000,
                scrollTop: 1000
            }
        });
        await prepareResolve;
        expect(testMockRows.length).toBe(mockRows.length + 1);
    });

    it("should allow disabling fetching more data", async () => {
        const mockUpdateSelection = jest.fn();
        const comms: IViewComms = {
            ui: {
                updateSelection: mockUpdateSelection
            }
        } as any;

        const testMockRows = [...mockRows];
        const testMockDataFrame = {
            ...mockDataFrame,
            rowCount: 4
        };

        const success = jest.fn();

        testMockDataFrame.loadRows = () => {
            if (testMockRows.length < 4) {
                testMockRows.push({
                    data: [testMockRows.length - 1, "hello"],
                    index: testMockRows.length - 1
                });
                success();
            }
            return AsyncTask.resolve(testMockRows);
        };

        renderGrid(comms, testMockDataFrame, { disableFetching: true });
        const gridElement = getGridElement();

        fireEvent.scroll(gridElement, {
            currentTarget: {
                scrollHeight: 1000,
                scrollTop: 1000
            }
        });
        await new Promise((r) => setTimeout(r, 100));
        expect(success.mock.calls).toHaveLength(0);
        expect(testMockRows.length).toBe(mockRows.length);
    });
});
