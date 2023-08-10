import { IHistoryItem } from "./history";
import { ColumnType } from "./datatypes";
import { INTERRUPTED_ERROR, AsyncTask, DeferredTask } from "./tasks";
import { PreviewStrategy } from "./engine";
import { IRuntimeError } from "./errors";
import { PriorityExecQueue } from "./queue";

/**
 * The minimum number of rows in a dataframe to load at a time. This should usually be enough to fill the grid viewport.
 * We should actually load more than this if feasible, depending on the "width" of the dataset.
 */
export const MinimumRowChunkSize = 50;

/**
 * The data frame is an abstract representation of the rendered table and is a shared contract between the orchestrator
 * and the UI. Arbitrary backends are supported provided that their engines generate data frames that follow this
 * typing.
 */
export interface IDataFrame extends IDataFrameHeader {
    /** Total number of rows available. */
    rowCount: number;

    /**
     * Gets rows in the dataframe. Always returns rows starting from the beginning of the dataframe.
     * If `slice` is true, will slice the array to return at most the number of rows requested. Defaults to false.
     * Implementations should fetch rows lazily, and should also cache loaded rows for performance.
     * See `getDataFrameLoader` for an example implementation.
     *
     * Note that the number of returned rows may be less than requested if the loading was interrupted.
     */
    loadRows(minCount: number, slice?: boolean): AsyncTask<IDataFrameRow[]>;

    /**
     * Synchronously get all currently loaded rows.
     * Useful when performing synchronous operations if you know some rows have already been loaded.
     */
    getLoadedRows(): IDataFrameRow[];

    /**
     * Calculate stats for the dataframe. This should be cached. Returns `null` if loading was interrupted.
     */
    loadStats(): AsyncTask<IDataFrameStats | null>;

    /**
     * Gets the stats for the dataframe if they have already been calculated.
     */
    tryGetStats(): IDataFrameStats | null;

    /**
     * Calculate stats & visualization data for a column. This should be cached. Returns `null` if loading was interrupted.
     */
    loadColumnStats(columnIndex: number): AsyncTask<IDataFrameColumnStats | null>;

    /**
     * Gets the stats data for the given column if they have already been calculated.
     */
    tryGetColumnStats(columnIndex: number): IDataFrameColumnStats | null;

    /**
     * Returns a map containing all currently loaded column stats.
     */
    getLoadedColumnStats(): Readonly<Record<number, IDataFrameColumnStats>>;

    /**
     * Interrupts the current loading requests, if any.
     * Also prevents future loading requests from completing until `enableLoading()` is called.
     */
    interruptLoading(): Promise<void>;

    /**
     * Re-enables loading after interrupt.
     */
    enableLoading(): void;

    /**
     * Clears cached data. This is useful to keep a reference to the dataframe while limiting memory usage.
     */
    cleanCache(options: { keepRows?: number; rows?: boolean; stats?: boolean; columnStats?: boolean }): void;
}

/**
 * Header information for a data frame.
 */
export interface IDataFrameHeader {
    /** The name of the associated variable. */
    variableName: string;

    /** The name of the associated file, if any. */
    fileName?: string;

    /** The shape of the data frame. */
    shape: {
        rows: number;
        columns: number;
    };

    /** List of columns in the data frame. */
    columns: IDataFrameColumn[];

    /** The name of the associated "old" variable, if this is a preview data frame. */
    oldVariableName?: string;

    /** The shape of the previous data frame, if this is a preview. */
    oldShape?: {
        rows: number;
        columns: number;
    };

    /** Whether the data frame is a preview data frame. */
    isPreview?: boolean;
    /** The preview strategy used for this dataframe (if preview) */
    previewStrategy?: PreviewStrategy;
    /** Whether the dataframe is unmodified. */
    isPreviewUnchanged?: boolean;

    /** Whether the data frame was displayed due to an error. */
    displayedDueToError?: boolean;

    /** Whether the data frame was displayed due to incomplete operation arguments. */
    displayedDueToMissingArguments?: boolean;

    /** If code execution was skipped, we attach the history item of the operation we would have run. */
    codeGenPreviewHistoryItem?: IHistoryItem;

    /** Error that caused this data frame to be shown. */
    error?: IRuntimeError & {
        executedHistoryItem?: IHistoryItem; // sometimes we get errors before execution, so this can be undefined in those cases
    };

    /** The shape of the preview data frame. */
    previewShape?: {
        rows: number;
        columns: number;
    };

    /** Whether this dataframe was originally loaded with truncation. */
    wasInitialDataTruncated?: boolean;

    /**
     * The associated history item. This is mainly used for previewing behaviour as we end up with ephemeral history
     * items that are easier to track along with the preview data frame.
     */
    historyItem: IHistoryItem;

    /** Name of the index column. */
    indexColumnKey: string;
}

/**
 * A column in the data frame.
 */
export interface IDataFrameColumn {
    /** Displayed name for the column (not necessarily unique). */
    name: string;

    /**
     * Key for the column -- for example an escaped string (with quotes), a number, a tuple, etc.
     * This should be used by the engine for identifying the column when executing code.
     */
    key: string;

    /** Column index in the dataframe. */
    index: number;

    /** The type of the column data. */
    type: ColumnType;

    /** The type of the column data (raw representation from engine). */
    rawType: string;

    /** Whether there are mixed data types in this column. */
    isMixed: boolean;

    /** Total number of rows in column. */
    totalCount: number;

    /** Annotations for the preview for grid highlighting. */
    annotations?: IPreviewColumnAnnotation;
}

/**
 * Overall statistics for a dataframe.
 * Note that for preview dataframes, these stats reflect the new data alone.
 */
export interface IDataFrameStats {
    /** The size of the data frame in bytes. */
    size: number;

    /** Number of missing cells. */
    missingValueCellsCount: number;

    /** Number of rows with missing data. */
    missingValueRowsCount: number;

    /** Number of missing values by column index. Removed columns in preview dataframes will be `null`. */
    missingValuesByColumn: Array<number | null>;

    /** Number of duplicate rows. */
    duplicateRowsCount: number;
}

/**
 * Statistics for a dataframe column.
 */
export interface IDataFrameColumnStats {
    /** Number of missing entries in column. */
    missingCount: number;

    /**
     * Number of unique values in column.
     * May be missing if the data is not hashable.
     */
    uniqueCount?: number;

    /** Visualization data for the column. */
    visualization?: IColumnVisualization;

    /** If the column is a numerical type, the corresponding statistics. */
    numericalData?: {
        /** The mean of the column. */
        mean: number | string;

        /** The min value of the column. */
        min: number | string;

        /** The 25th percentile of the column. */
        "25%": number | string;

        /** The median of the column. */
        median: number | string;

        /** The 75th percentile of the column. */
        "75%": number | string;

        /** The max value of the column. */
        max: number | string;

        /** The standard deviation of the column. */
        std: number | string;

        /** Kurtosis obtained using Fisher's definition, normalized by N-1. */
        kurtosis: number | string;

        /** Skew, normalized by N-1. */
        skew: number | string;
    };

    /** If the column is a categorical type, the corresponding categorical data. */
    categoricalData?: {
        /** The most frequently occurring value and its frequency. */
        top: {
            /** The most frequently occurring value. */
            value: string;

            /** Frequency of the most frequently occurring value. */
            frequency: number;
        };
    };
}

export type IColumnVisualization =
    | INumericalVisualization
    | ICategoricalVisualization
    | IBooleanVisualization
    | IDateTimeVisualization;

export enum IColumnVisualizationType {
    Numerical = "numerical",
    Categorical = "categorical",
    Boolean = "boolean",
    DateTime = "datetime"
}

export interface IBaseVisualization {
    type: IColumnVisualizationType;
}

export interface INumericalVisualization extends IBaseVisualization {
    type: IColumnVisualizationType.Numerical;
    min: number;
    max: number;
    /** The number of decimal places to show in bin ranges. */
    binPrecision: number;
    bins: Array<{
        min: number;
        max: number;
        count: number;
    }>;
}

export interface ICategoricalVisualization extends IBaseVisualization {
    type: IColumnVisualizationType.Categorical;
    categories: Array<{
        label: string;
        count: number;
    }>;
    other: number;
}

export interface IBooleanVisualization extends IBaseVisualization {
    type: IColumnVisualizationType.Boolean;
    trueCount: number;
    falseCount: number;
}

export interface IDateTimeVisualization extends IBaseVisualization {
    type: IColumnVisualizationType.DateTime;
    min: Date;
    max: Date;
}

/**
 * A single row of data.
 */
export type IDataFrameRow = {
    /** Annotations for the preview for grid highlighting. */
    annotations?: IGridRowAnnotation;

    /** Row index. */
    index: number;

    /** Column data by index. */
    data: any[];
};

/**
 * Types of preview annotations. Note that we do not have a `modified` type as modified columns are represented in the dataframe
 * as a removed column and an added column.
 */
export enum PreviewAnnotationType {
    Added = "added",
    Removed = "removed"
}

/**
 * Column annotations for identifying what has changed in the preview, such as for highlighting in the grid.
 */
export interface IPreviewColumnAnnotation {
    /** Type of annotation. */
    annotationType?: PreviewAnnotationType;

    /** Whether the column was targeted by the previewed operation. Used in the grid. */
    isTargeted?: boolean;

    /** Row number of cells that are considered significant for derived columns. */
    significantCells?: number[];

    /** Row number of cells that are editable if an array is passed, otherwise all cells are editable. */
    editableCells?: number[] | true;

    /**
     * Index of last row (inclusive) of data when there is padding. If this value is undefined,
     * then we assume that the height of the column is the same as the rest of the data frame.
     */
    dataEndIndex?: number;
}

/**
 * Grid row annotations for highlighting.
 */
export interface IGridRowAnnotation {
    /** Type of annotation. */
    annotationType?: PreviewAnnotationType;

    /** Whether the row was targeted by the previewed operation. Used in the grid. */
    isTargeted?: boolean;

    /** column positions of cells that have been modified. */
    modifiedColumns?: number[];
}

/**
 * Provides an implementation of data frame caching.
 *
 * @param loadRows - Function for loading row data. Takes a start and end index.
 *      This doesn't have to actually return as many rows as are requested -- if it doesn't, it will be called multiple times with new start indices.
 *      This allows the implementation to decide how the data should be chunked.
 */
export function getDataFrameLoader<RowCursor>(
    header: IDataFrameHeader,
    {
        loadRows,
        loadStats,
        loadColumnStats,
        getCursorForRow
    }: {
        loadRows: (
            cursor: RowCursor | undefined,
            range: { start: number; end: number }
        ) => AsyncTask<{
            rows: IDataFrameRow[];
            cursor: RowCursor;
        }>;
        loadStats: () => AsyncTask<IDataFrameStats>;
        loadColumnStats: (index: number) => AsyncTask<IDataFrameColumnStats>;
        getCursorForRow: (rowIndex: number) => RowCursor;
    },
    {
        rows = [],
        stats = null,
        columnStats = {}
    }: {
        rows?: IDataFrameRow[];
        stats?: IDataFrameStats | null;
        columnStats?: Record<number, IDataFrameColumnStats>;
    } = {}
): IDataFrame {
    const rowLoader = getRowLoader(header, rows, loadRows, getCursorForRow);
    const statsLoader = getStatsLoader(header, stats, loadStats);
    const columnStatsLoader = getColumnStatsLoader(header, columnStats, loadColumnStats);

    return {
        ...header,
        ...rowLoader,
        ...statsLoader,
        ...columnStatsLoader,
        interruptLoading: async () => {
            await Promise.all([
                rowLoader.interruptLoading(),
                statsLoader.interruptLoading(),
                columnStatsLoader.interruptLoading()
            ]);
        },
        enableLoading: () => {
            rowLoader.enableLoading();
            statsLoader.enableLoading();
            columnStatsLoader.enableLoading();
        },
        cleanCache: (opts) => {
            rowLoader.cleanCache(opts);
            statsLoader.cleanCache(opts);
            columnStatsLoader.cleanCache(opts);
        }
    };
}

type LoaderCommonMethods = "interruptLoading" | "enableLoading" | "cleanCache";

function getRowLoader<RowCursor>(
    header: IDataFrameHeader,
    rows: IDataFrameRow[],
    loadRows: (
        cursor: RowCursor | undefined,
        range: { start: number; end: number }
    ) => AsyncTask<{
        rows: IDataFrameRow[];
        cursor: RowCursor;
    }>,
    getCursorForRow: (rowIndex: number) => RowCursor
): Pick<IDataFrame, "rowCount" | "loadRows" | "getLoadedRows" | LoaderCommonMethods> {
    const totalRows = header.previewShape ? header.previewShape.rows : header.shape.rows;

    // We can interrupt & re-enable loading of rows / stats. Keep track of which state we are in.
    let disableLoading = false;

    let rowCursor: RowCursor | undefined;
    let queue = new PriorityExecQueue(
        AsyncTask.factory("loadRows", async (subtask, end: number) => {
            try {
                while (rows.length < end && !disableLoading) {
                    const rememberedRows = rows;
                    const result = await subtask(loadRows(rowCursor, { start: rows.length, end }));

                    // Rows may change if the cache is cleaned. In this case we just ignore the result and stop.
                    if (rows !== rememberedRows) {
                        break;
                    }

                    rows.push(...result.rows);
                    rowCursor = result.cursor;
                }
            } catch (e) {
                if (e !== INTERRUPTED_ERROR) {
                    throw e;
                }
            }
        }),
        // Prioritize requests by the number of rows requested. This way we can try to load as many rows as needed.
        (end) => end,
        "__queue" // `__` prevents the queuing tasks from appearing in trace logs for simplicity
    );

    return {
        rowCount: totalRows,
        loadRows: (count: number, slice = false) => {
            if (count > totalRows) {
                count = totalRows;
            }

            return queue.execute(count).then(() => {
                if (slice) {
                    return rows.slice(0, count);
                } else {
                    return rows;
                }
            });
        },
        getLoadedRows: () => rows,
        interruptLoading: () => {
            disableLoading = true;
            return queue.interrupt();
        },
        enableLoading: () => {
            disableLoading = false;
        },
        cleanCache: (opts) => {
            if (opts.rows || opts.keepRows) {
                if (opts.keepRows) {
                    if (rows.length > opts.keepRows) {
                        rows = rows.slice(0, opts.keepRows);
                        rowCursor = getCursorForRow(opts.keepRows);
                    }
                } else {
                    rows = [];
                    rowCursor = undefined;
                }
                queue.interruptAll();
            }
        }
    };
}

function getStatsLoader(
    header: IDataFrameHeader,
    stats: IDataFrameStats | null,
    loadStats: () => AsyncTask<IDataFrameStats>
): Pick<IDataFrame, "loadStats" | "tryGetStats" | LoaderCommonMethods> {
    let queue = new PriorityExecQueue<void, IDataFrameStats | null>(
        AsyncTask.factory("loadStats", async (subtask) => {
            try {
                if (!stats && !disableLoading) {
                    const result = await subtask(loadStats());
                    stats = result;
                }
            } catch (e) {
                if (e !== INTERRUPTED_ERROR) {
                    throw e;
                }
            }
            return stats;
        }),
        undefined,
        "__queue" // `__` prevents the queuing tasks from appearing in trace logs for simplicity
    );

    // We can interrupt & re-enable loading of rows / stats. Keep track of which state we are in.
    let disableLoading = false;

    return {
        loadStats: () => queue.execute(),
        tryGetStats: () => stats,
        interruptLoading: () => {
            disableLoading = true;
            return queue.interrupt();
        },
        enableLoading: () => {
            disableLoading = false;
        },
        cleanCache: (opts) => {
            if (opts.stats) {
                stats = null;
                queue.interruptAll();
            }
        }
    };
}

function getColumnStatsLoader(
    header: IDataFrameHeader,
    columnStats: Record<number, IDataFrameColumnStats>,
    loadColumnStats: (index: number) => AsyncTask<IDataFrameColumnStats>
): Pick<IDataFrame, "loadColumnStats" | "tryGetColumnStats" | "getLoadedColumnStats" | LoaderCommonMethods> {
    let queue = new PriorityExecQueue(
        AsyncTask.factory("loadColumnStats", async (subtask, index) => {
            try {
                if (!columnStats[index] && !disableLoading) {
                    const result = await subtask(loadColumnStats(index));
                    columnStats[index] = result;
                }
            } catch (e) {
                if (e !== INTERRUPTED_ERROR) {
                    throw e;
                }
            }
            return columnStats[index] || null;
        }),
        undefined,
        "__queue" // `__` prevents the queuing tasks from appearing in trace logs for simplicity
    );

    // We can interrupt & re-enable loading of rows / stats. Keep track of which state we are in.
    let disableLoading = false;

    return {
        loadColumnStats: (index) => queue.execute(index),
        tryGetColumnStats: (index) => columnStats[index] || null,
        getLoadedColumnStats: () => columnStats,
        interruptLoading: () => {
            disableLoading = true;
            return queue.interrupt();
        },
        enableLoading: () => {
            disableLoading = false;
        },
        cleanCache: (opts) => {
            if (opts.columnStats) {
                columnStats = {};
                queue.interruptAll();
            }
        }
    };
}
