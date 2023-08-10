import { AsyncTask, IDataFrame, IViewComms } from "@dw/messaging";

export const mockComms = {} as IViewComms;
export const mockRows = [
    {
        data: [0, "foo", 0],
        index: 0
    },
    {
        data: [1, "bar", 0],
        index: 1
    },
    {
        data: [2, "hello", 0],
        index: 2
    }
];

export const mockDataFrame: IDataFrame = {
    columns: [
        {
            name: "Index",
            key: "'Index'",
            index: 0,
            totalCount: 3
        },
        {
            name: "A",
            key: "'A'",
            index: 1,
            totalCount: 3
        },
        {
            name: "B",
            key: "'B'",
            index: 2,
            totalCount: 3
        }
    ] as Array<any>,
    historyItem: {
        index: 0
    } as any,
    indexColumnKey: "",
    shape: {
        columns: 3,
        rows: 3
    },
    variableName: "df",
    rowCount: 3,
    loadRows: () => AsyncTask.resolve(mockRows),
    getLoadedRows: () => mockRows,
    loadStats: function () {
        throw new Error("Function not implemented.");
    },
    tryGetStats: function () {
        throw new Error("Function not implemented.");
    },
    tryGetColumnStats: function () {
        return {
            missingCount: 0,
            uniqueCount: 0
        };
    },
    loadColumnStats: () =>
        AsyncTask.resolve({
            missingCount: 0,
            uniqueCount: 0
        }),
    getLoadedColumnStats: function () {
        return {};
    },
    interruptLoading: async function () {
        throw new Error("Function not implemented.");
    },
    enableLoading: function () {},
    cleanCache: function () {}
};
