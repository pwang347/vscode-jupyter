import { GridSelectionPlugin, IGridSelection } from "./gridSelectionPlugin";

const mockCtrlKeyClick = {
    ctrlKey: true
} as any;
const mockShiftKeyClick = {
    shiftKey: true
} as any;

describe("GridSelectionPlugin", () => {
    function getGridSelectionPlugin() {
        return new GridSelectionPlugin(
            () => [],
            () => {}
        );
    }

    it("should handle base column header clicks", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectColumn(0);
        const expectedSelection: IGridSelection = {
            columns: [0],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);

        gridSelectionPlugin.selectColumn(3);
        const expectedSelection2: IGridSelection = {
            columns: [3],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);
    });

    it("should handle column header clicks with ctrl click", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectColumn(1);
        gridSelectionPlugin.selectColumn(3, mockCtrlKeyClick);
        gridSelectionPlugin.selectColumn(0, mockCtrlKeyClick);
        const expectedSelection: IGridSelection = {
            columns: [1, 3, 0],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);
    });

    it("should handle column header clicks with shift click", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectColumn(0);
        gridSelectionPlugin.selectColumn(5, mockShiftKeyClick);
        const expectedSelection: IGridSelection = {
            columns: [0, 1, 2, 3, 4, 5],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 5,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);
        gridSelectionPlugin.selectColumn(3, mockShiftKeyClick);
        const expectedSelection2: IGridSelection = {
            columns: [0, 1, 2, 3],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);
    });

    it("should handle base cell clicks", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectCell(0, 0);
        const expectedSelection: IGridSelection = {
            columns: [],
            rows: [0],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: 0
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);

        gridSelectionPlugin.selectCell(2, 3);
        const expectedSelection2: IGridSelection = {
            columns: [],
            rows: [2],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: 2
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);
    });

    it("should handle cell clicks with ctrl click", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectCell(0, 0);
        const expectedSelection: IGridSelection = {
            columns: [],
            rows: [0],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: 0
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);

        gridSelectionPlugin.selectCell(2, 3, mockCtrlKeyClick);
        const expectedSelection2: IGridSelection = {
            columns: [],
            rows: [0, 2],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: 2
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);
    });

    it("should handle cell clicks with shift click", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectCell(0, 0);
        gridSelectionPlugin.selectCell(2, 3, mockShiftKeyClick);

        const expectedSelection: IGridSelection = {
            columns: [],
            rows: [0, 1, 2],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: 2
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);

        gridSelectionPlugin.selectCell(1, 2, mockShiftKeyClick);
        const expectedSelection2: IGridSelection = {
            columns: [],
            rows: [0, 1],
            isEntireTableSelected: false,
            activeCell: {
                column: 2,
                row: 1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);
    });

    it("should remove column selections if cell clicked and vice versa", () => {
        const gridSelectionPlugin = getGridSelectionPlugin();
        gridSelectionPlugin.selectColumn(0);
        const expectedSelection: IGridSelection = {
            columns: [0],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection);

        gridSelectionPlugin.selectCell(0, 3);
        const expectedSelection2: IGridSelection = {
            columns: [],
            rows: [0],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: 0
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection2);

        gridSelectionPlugin.selectColumn(3);
        const expectedSelection3: IGridSelection = {
            columns: [3],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection3);

        // same for ctrl click
        gridSelectionPlugin.selectCell(5, 3, mockCtrlKeyClick);
        const expectedSelection4: IGridSelection = {
            columns: [],
            rows: [5],
            isEntireTableSelected: false,
            activeCell: {
                column: 3,
                row: 5
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection4);

        gridSelectionPlugin.selectColumn(4, mockCtrlKeyClick);
        const expectedSelection5: IGridSelection = {
            columns: [4],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 4,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection5);

        // same for shift click
        gridSelectionPlugin.selectCell(6, 1, mockShiftKeyClick);
        const expectedSelection6: IGridSelection = {
            columns: [],
            rows: [6],
            isEntireTableSelected: false,
            activeCell: {
                column: 1,
                row: 6
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection6);

        gridSelectionPlugin.selectColumn(0, mockShiftKeyClick);
        const expectedSelection7: IGridSelection = {
            columns: [0],
            rows: [],
            isEntireTableSelected: false,
            activeCell: {
                column: 0,
                row: -1
            }
        };
        expect(gridSelectionPlugin.getSelection()).toEqual(expectedSelection7);
    });
});
