import { IDataFrame, IDataFrameColumn, IDataFrameRow, IGridCellEdit } from "@dw/messaging";
import { getCellProps } from "./cell";

const mockDataFrame: IDataFrame = {} as IDataFrame;
const mockDataFrameColumn: IDataFrameColumn = {} as IDataFrameColumn;
const mockDataFrameRow: IDataFrameRow = {
    data: {
        [1]: "bar"
    } as any,
    index: 1
} as IDataFrameRow;

describe("Cell helpers unit tests", () => {
    describe("getCellProps", () => {
        const getCellPropsBase = (
            params: Partial<{
                dataFrame: IDataFrame;
                dataFrameColumn: IDataFrameColumn;
                dataFrameRow: IDataFrameRow;
                gridRowIndex: number;
                gridColumnIndex: number;
                gridCellEdits: IGridCellEdit[];
                stagedEdit?: IGridCellEdit;
            }>
        ) => {
            return getCellProps({
                dataFrame: mockDataFrame,
                dataFrameColumn: mockDataFrameColumn,
                dataFrameRow: mockDataFrameRow,
                gridRowIndex: 1,
                gridColumnIndex: 1,
                gridCellEdits: [],
                ...params
            });
        };

        describe("isEditable", () => {
            it("should return `isEditable` true if annotation is set to true", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn
                    }).isEditable
                ).toBe(true);
            });

            it("should return `isEditable` false if no annotation provided", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn
                    }).isEditable
                ).toBe(false);
            });

            it("should return `isEditable` false if annotation row index provided, but doesn't match", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: [0]
                            }
                        } as IDataFrameColumn
                    }).isEditable
                ).toBe(false);
            });

            it("should return `isEditable` false if annotation row index provided and matches", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: [0]
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 0
                    }).isEditable
                ).toBe(true);
            });
        });

        describe("isPaddingCell", () => {
            it("should return true if data end annotation provided and row is beyond that", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                dataEndIndex: 2
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 5
                    }).isPaddingCell
                ).toBe(true);
            });

            it("should return false if data end annotation provided and row is not beyond that", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                dataEndIndex: 2
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 1
                    }).isPaddingCell
                ).toBe(false);
            });

            it("should return false if data end annotation not provided", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn,
                        gridRowIndex: 5
                    }).isPaddingCell
                ).toBe(false);
            });
        });

        describe("isLastRow", () => {
            it("should return true if row index matches the length of the column (no annotations)", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            rowCount: 6
                        } as IDataFrame,
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn,
                        gridRowIndex: 5
                    }).isLastRow
                ).toBe(true);
            });

            it("should return false if row index does not match the length of the column (no annotations)", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            rowCount: 6
                        } as IDataFrame,
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn,
                        gridRowIndex: 4
                    }).isLastRow
                ).toBe(false);
            });

            it("should return true if row index matches the length of the column (with annotations)", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            rowCount: 6
                        } as IDataFrame,
                        dataFrameColumn: {
                            annotations: {
                                dataEndIndex: 2
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 2
                    }).isLastRow
                ).toBe(true);
            });

            it("should return true if row index doesn't match the length of the column (with annotations)", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            rowCount: 6
                        } as IDataFrame,
                        dataFrameColumn: {
                            annotations: {
                                dataEndIndex: 2
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 6
                    }).isLastRow
                ).toBe(false);
            });
        });

        describe("hasStagedEdit", () => {
            it("should be true if cell is editable and staged edit matches index", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        stagedEdit: {
                            row: 123,
                            column: 456,
                            value: "foo"
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).hasStagedEdit
                ).toBe(true);
            });

            it("should be false if cell is not editable but staged edit matches index", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn,
                        stagedEdit: {
                            row: 123,
                            column: 456,
                            value: "foo"
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).hasStagedEdit
                ).toBe(false);
            });

            it("should be false if cell is editable but staged edit does not match index", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {}
                        } as IDataFrameColumn,
                        stagedEdit: {
                            row: 1231,
                            column: 456,
                            value: "foo"
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).hasStagedEdit
                ).toBe(false);
            });
        });

        describe("cellEdit", () => {
            it("should return staged edit if available and matching coords", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        dataFrameRow: {
                            data: {
                                [456]: "bar"
                            } as any,
                            index: 123
                        },
                        stagedEdit: {
                            row: 123,
                            column: 456,
                            value: "foo"
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    })
                ).toMatchObject({
                    cellEdit: {
                        row: 123,
                        column: 456,
                        value: "foo"
                    },
                    isEdited: true
                });
            });

            it("should return undefined if not matching", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        dataFrameRow: {
                            data: {
                                [456]: "bar"
                            } as any,
                            index: 123
                        },
                        stagedEdit: {
                            row: 1231,
                            column: 456,
                            value: "foo"
                        },
                        gridCellEdits: [
                            {
                                row: 1231,
                                column: 456,
                                value: "foo"
                            }
                        ],
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    })
                ).toMatchObject({ cellEdit: undefined, isEdited: false });
            });

            it("should return committed edit if available and matching coords", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        dataFrameRow: {
                            data: {
                                [456]: "bar"
                            } as any,
                            index: 123
                        },
                        gridCellEdits: [
                            {
                                row: 1231,
                                column: 456,
                                value: "foo"
                            },
                            {
                                row: 123,
                                column: 456,
                                value: "foo"
                            }
                        ],
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    })
                ).toMatchObject({
                    cellEdit: { row: 123, column: 456, value: "foo" },
                    isEdited: true
                });
            });
        });

        describe("isSignificantInput", () => {
            it("should return true if row contained in list", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                significantCells: [123]
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).isSignificantInput
                ).toEqual(true);
            });

            it("should return false if row not contained in list", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                significantCells: [1231]
                            }
                        } as IDataFrameColumn,
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).isSignificantInput
                ).toEqual(false);
            });
        });

        describe("isAutoFilled", () => {
            it("should return true if value exists but wasn't edited", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        dataFrameRow: {
                            data: {
                                [456]: "bar"
                            } as any,
                            index: 123
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).isAutoFilled
                ).toEqual(true);
            });

            it("should return true if value exists but there was an edit", () => {
                expect(
                    getCellPropsBase({
                        dataFrameColumn: {
                            annotations: {
                                editableCells: true
                            }
                        } as IDataFrameColumn,
                        dataFrameRow: {
                            data: {
                                [456]: "bar"
                            } as any,
                            index: 123
                        },
                        stagedEdit: {
                            row: 123,
                            column: 456,
                            value: "foo"
                        },
                        gridRowIndex: 123,
                        gridColumnIndex: 456
                    }).isAutoFilled
                ).toEqual(false);
            });
        });

        describe("displayedDueToError", () => {
            it("should return true if error attached on df", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            displayedDueToError: true
                        } as IDataFrame
                    }).displayedDueToError
                ).toEqual(true);
            });

            it("should return false if error not attached on df", () => {
                expect(
                    getCellPropsBase({
                        dataFrame: {
                            displayedDueToError: false
                        } as IDataFrame
                    }).displayedDueToError
                ).toEqual(false);
            });
        });
    });
});
