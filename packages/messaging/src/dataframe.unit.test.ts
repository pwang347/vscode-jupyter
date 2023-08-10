import * as assert from "assert";

import {
    getDataFrameLoader,
    IDataFrameColumnStats,
    IDataFrameHeader,
    IDataFrameRow,
    IDataFrameStats
} from "./dataframe";
import { AsyncTask } from "./tasks";

const header: IDataFrameHeader = {
    columns: [],
    historyItem: null!,
    indexColumnKey: "",
    shape: {
        columns: 1,
        rows: 100
    },
    variableName: "df"
};

type TestCursor = { start: number; data?: string } | undefined;
type RowLoader = { cursor?: TestCursor; resolve: (rows: any[], cursor?: TestCursor) => void };
type ColumnStatsLoader = { columnIndex?: number; resolve: (insights: any) => void };
type StatsLoader = { resolve: (stats: any) => void };
function simpleLoad(
    rows?: IDataFrameRow[],
    stats?: IDataFrameStats,
    columnStats?: Record<number, IDataFrameColumnStats>
) {
    let setRowLoader: (loader: RowLoader) => void;
    let rowLoaderPromise = new Promise<RowLoader>((resolve) => {
        setRowLoader = resolve;
    });
    let setStatsLoader: (loader: StatsLoader) => void;
    let statsLoaderPromise = new Promise<StatsLoader>((resolve) => {
        setStatsLoader = resolve;
    });
    let setColumnStatsLoader: (loader: ColumnStatsLoader) => void;
    let ColumnStatsLoaderPromise = new Promise<ColumnStatsLoader>((resolve) => {
        setColumnStatsLoader = resolve;
    });
    const df = getDataFrameLoader<TestCursor>(
        header,
        {
            loadRows: (cursor) =>
                AsyncTask.resolve(
                    new Promise<{ rows: IDataFrameRow[]; cursor: TestCursor }>((resolve) => {
                        setRowLoader({
                            cursor,
                            resolve: (rows, cursor) => {
                                rowLoaderPromise = new Promise((resolve) => {
                                    setRowLoader = resolve;
                                });
                                resolve({ rows, cursor });
                            }
                        });
                    })
                ),
            loadStats: () =>
                AsyncTask.resolve(
                    new Promise<IDataFrameStats>((resolve) => {
                        setStatsLoader({
                            resolve
                        });
                    })
                ),
            loadColumnStats: (columnIndex) =>
                AsyncTask.resolve(
                    new Promise<IDataFrameColumnStats>((resolve) => {
                        setColumnStatsLoader({
                            columnIndex,
                            resolve: (stats) => {
                                ColumnStatsLoaderPromise = new Promise((resolve) => {
                                    setColumnStatsLoader = resolve;
                                });
                                resolve(stats);
                            }
                        });
                    })
                ),
            getCursorForRow: (start) => ({ start, data: "reset" })
        },
        {
            rows,
            stats,
            columnStats
        }
    );
    return [df, () => rowLoaderPromise, () => statsLoaderPromise, () => ColumnStatsLoaderPromise] as const;
}

describe("getDataFrameLoader helper function", () => {
    it("Lazily loads rows in chunks", async () => {
        const [df, getRowLoader] = simpleLoad();

        assert.equal(df.rowCount, 100);

        assert.deepStrictEqual(df.getLoadedRows(), []);
        const load10 = df.loadRows(10);
        let loader = await getRowLoader();
        assert.deepStrictEqual(loader.cursor, undefined);
        loader.resolve([0, 1, 2, 3, 4], { start: 5, data: "foo" });

        // After loading 5 rows, it should request more since we haven't loaded 10 yet.
        loader = await getRowLoader();
        // Cursor should be passed on
        assert.deepStrictEqual(loader.cursor, { start: 5, data: "foo" });
        loader.resolve([5, 6, 7, 8, 9], { start: 10 });
        const rows = await load10;
        assert.deepStrictEqual(rows, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

        const loaded = df.getLoadedRows();
        assert.strictEqual(rows, loaded);
    });

    it("Does not load rows unless necessary", async () => {
        const [df, getRowLoader] = simpleLoad();

        const load5 = df.loadRows(5);
        let loader = await getRowLoader();
        loader.resolve([1, 2, 3, 4, 5]);
        await load5;

        const load5Again = df.loadRows(5);
        // We shouldn't have to load any rows here since they are cached.
        const rows = await load5Again;
        assert.equal(rows.length, 5);
    });

    it("Can slice the loaded rows", async () => {
        const [df, getRowLoader] = simpleLoad();

        const load8 = df.loadRows(8, true);
        let loader = await getRowLoader();
        loader.resolve([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const rows = await load8;
        assert.deepStrictEqual(rows, [0, 1, 2, 3, 4, 5, 6, 7]);
        assert.deepStrictEqual(df.getLoadedRows(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("Overlapping ranges do not generate duplicate requests", async () => {
        const [df, getRowLoader] = simpleLoad();

        const load5 = df.loadRows(5, true);
        const load8 = df.loadRows(8, true);
        let loader = await getRowLoader();
        loader.resolve([0, 1, 2, 3, 4]);
        // Requests should only wait for the rows they need
        const rows5 = await load5;
        assert.deepStrictEqual(rows5, [0, 1, 2, 3, 4]);
        loader = await getRowLoader();

        const load10 = df.loadRows(10, true);
        // We should be able to return more rows than requested.
        loader.resolve([5, 6, 7, 8, 9]);
        const rows8 = await load8;
        assert.deepStrictEqual(rows8, [0, 1, 2, 3, 4, 5, 6, 7]);
        const rows10 = await load10;
        assert.deepStrictEqual(rows10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

        const load15 = df.loadRows(15, true);
        loader = await getRowLoader();
        loader.resolve([10, 11, 12, 13, 14]);
        const rows15 = await load15;
        assert.deepStrictEqual(rows15, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it("Lazily calculates stats", async () => {
        const [df, , getStatsLoader] = simpleLoad();

        assert.equal(df.tryGetStats(), undefined);
        const loadStats = df.loadStats();
        const loader = getStatsLoader();
        (await loader).resolve({ size: 0 });
        const stats = await loadStats;

        assert.deepStrictEqual(stats, { size: 0 });
        assert.equal(stats, df.tryGetStats());

        const loadStatsAgain = df.loadStats();
        const stats2 = await loadStatsAgain;

        assert.equal(stats, stats2);
    });

    it("Lazily calculates column stats", async () => {
        const [df, , , getColumnStatsLoader] = simpleLoad();

        assert.equal(df.tryGetColumnStats(1), undefined);
        const loadStats1 = df.loadColumnStats(1);
        const loader1 = getColumnStatsLoader();
        (await loader1).resolve({ foo: 1 });
        const stats1 = await loadStats1;

        assert.deepStrictEqual(stats1, { foo: 1 });
        assert.equal(stats1, df.tryGetColumnStats(1));

        const loadStats1Again = df.loadColumnStats(1);
        const stats1Again = await loadStats1Again;

        assert.equal(stats1, stats1Again);

        assert.equal(df.tryGetColumnStats(2), undefined);
        const loadStats2 = df.loadColumnStats(2);
        const loader2 = getColumnStatsLoader();
        (await loader2).resolve({ foo: 2 });
        const stats2 = await loadStats2;

        assert.deepStrictEqual(stats2, { foo: 2 });
        assert.equal(stats2, df.tryGetColumnStats(2));
    });

    it("Can clear cached data ", async () => {
        const rows: IDataFrameRow[] = [
            { data: [1, 2, 3, 4], index: 0 },
            { data: [5, 6, 7, 8], index: 1 },
            { data: [1, 2, 3, 4], index: 2 },
            { data: [1, 2, 3, 4], index: 3 }
        ];
        const stats: IDataFrameStats = {
            duplicateRowsCount: 10,
            missingValueCellsCount: 20,
            missingValueRowsCount: 30,
            missingValuesByColumn: [1, 0, 1, 0],
            size: 1337
        };
        const columnStats: Record<number, IDataFrameColumnStats> = {
            1: {
                missingCount: 10,
                uniqueCount: 20
            }
        };
        const [df] = simpleLoad(rows, stats, columnStats);

        assert.equal(df.getLoadedRows(), rows);
        assert.equal(df.tryGetStats(), stats);
        assert.equal(df.getLoadedColumnStats(), columnStats);

        df.cleanCache({ keepRows: 2 });
        const loadedRows = df.getLoadedRows();
        assert.equal(loadedRows.length, 2);
        assert.equal(loadedRows[0], rows[0]);
        assert.equal(loadedRows[1], rows[1]);

        df.cleanCache({ rows: true });
        assert.equal(df.getLoadedRows().length, 0);

        // Other data should be unaffected at this point
        assert.equal(df.tryGetStats(), stats);
        assert.equal(df.getLoadedColumnStats(), columnStats);

        df.cleanCache({ stats: true });
        assert.equal(df.tryGetStats(), null);

        df.cleanCache({ columnStats: true });
        assert.deepEqual(df.getLoadedColumnStats(), {});
    });
});
