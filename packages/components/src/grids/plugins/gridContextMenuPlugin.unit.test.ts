import { IDataFrame, PreviewAnnotationType } from "@dw/messaging";
import { IWranglerGridProps } from "../types";
import { GridContextMenuPlugin } from "./gridContextMenuPlugin";
import { LocalizedStrings } from "../../localization";

const mockDataFrame = {
    columns: [
        {
            key: "'index'",
            name: "index",
            index: 0
        },
        {
            key: "'foo'",
            name: "foo",
            index: 1,
            annotations: {
                annotationType: PreviewAnnotationType.Added
            }
        },
        {
            key: "'bar'",
            name: "bar",
            index: 2
        },
        {
            key: "'baz'",
            name: "baz",
            index: 3,
            isMixed: true
        }
    ]
} as IDataFrame;
const mockGridProps: Partial<IWranglerGridProps> = {
    renderers: {
        onRenderHeaderContextMenu: () => true as any
    },
    dataFrame: mockDataFrame,
    disabled: false,
    operationContextMenu: [],
    localizedStrings: LocalizedStrings.Grid
};

describe("GridContextMenuPlugin", () => {
    let contextMenuPlugin: GridContextMenuPlugin<any>;

    function getGridContextMenuPlugin() {
        return new GridContextMenuPlugin<any>(
            () => [],
            () => {},
            {} as any,
            () => {},
            {
                onSelectionChanged: () => {}
            } as any
        );
    }

    beforeEach(() => {
        contextMenuPlugin = getGridContextMenuPlugin();
    });

    describe("renderHeaderContextMenu", () => {
        it("should not render if only index column or preview columns are selected", () => {
            contextMenuPlugin.showHeaderContextMenu({} as any, 1);
            const rendered = contextMenuPlugin.renderHeaderContextMenu(
                mockGridProps as IWranglerGridProps,
                {
                    columns: [
                        {
                            key: "'index'",
                            name: "index",
                            index: 0
                        },
                        {
                            key: "'foo'",
                            name: "foo",
                            index: 1
                        }
                    ],
                    rows: [],
                    isEntireTableSelected: false
                },
                undefined
            );
            expect(rendered).toBe(undefined);
        });

        it("should render if a valid column is selected", () => {
            contextMenuPlugin.showHeaderContextMenu({} as any, 2);
            const rendered = contextMenuPlugin.renderHeaderContextMenu(
                mockGridProps as IWranglerGridProps,
                {
                    columns: [
                        {
                            key: "'bar'",
                            name: "bar",
                            index: 2
                        }
                    ],
                    rows: [],
                    isEntireTableSelected: false
                },
                mockGridProps.dataFrame
            );
            expect(rendered).toBe(true);
        });

        it("should still render if we have a mix of valid and invalid columns", () => {
            contextMenuPlugin.showHeaderContextMenu({} as any, 1);
            const rendered = contextMenuPlugin.renderHeaderContextMenu(
                mockGridProps as IWranglerGridProps,
                {
                    columns: [
                        {
                            key: "'index'",
                            name: "index",
                            index: 0
                        },
                        {
                            key: "'foo'",
                            name: "foo",
                            index: 1
                        },
                        {
                            key: "'bar'",
                            name: "bar",
                            index: 2
                        }
                    ],
                    rows: [],
                    isEntireTableSelected: false
                },
                mockGridProps.dataFrame
            );
            expect(rendered).toBe(true);
        });

        it("should show disabled operation items", () => {
            contextMenuPlugin.showHeaderContextMenu({} as any, 3);
            let renderedProps;
            const rendered = contextMenuPlugin.renderHeaderContextMenu(
                {
                    ...(mockGridProps as IWranglerGridProps),
                    renderers: {
                        onRenderHeaderContextMenu: (props) => {
                            renderedProps = props;
                            return true as any;
                        },
                        onRenderOperationContextMenuItem: (props) => props as any
                    },
                    operationContextMenu: [
                        {
                            text: "Filter",
                            itemType: "operation",
                            targetFilter: {},
                            operation: {
                                key: "filter"
                            }
                        },
                        {
                            text: "Sort",
                            itemType: "operation",
                            targetFilter: {
                                allowMixedType: true
                            },
                            operation: {
                                key: "sort"
                            }
                        }
                    ],
                    operations: [
                        {
                            key: "filter",
                            name: "Filter",
                            helpText: "",
                            category: "Sort and filter",
                            args: []
                        },
                        {
                            key: "sort",
                            name: "Sort",
                            helpText: "",
                            category: "Sort and filter",
                            args: []
                        }
                    ]
                },
                {
                    columns: [
                        {
                            key: "'baz'",
                            name: "baz",
                            index: 3
                        }
                    ],
                    rows: [],
                    isEntireTableSelected: false
                },
                mockGridProps.dataFrame
            );
            expect(rendered).toBe(true);
            expect((renderedProps as any)?.operationContextMenuItems).toMatchObject([
                {
                    disabledReason: "Mixed columns are not allowed for this operation"
                },
                { disabledReason: undefined }
            ]);
        });
    });
});
