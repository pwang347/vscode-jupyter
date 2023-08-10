import dependenciesPythonCode from "./dependencies.python";
import dataframePythonCode from "./dataframe.python";
import sessionsPythonCode from "./sessions.python";
import {
    IDataFrameHeader,
    IDataFrameRow,
    IResolvedPackageDependencyMap,
    IDataFrameStats,
    IDataFrameColumnStats
} from "@dw/messaging";

/**
 * Response for get_dataframe_info.
 */
export type IGetDataframeInfoResponse = IDataFrameHeader;

/**
 * Response for get_dataframe_header_stats
 */
export type IGetDataframeHeaderStatsResponse = IDataFrameStats;

/**
 * Response for get_dataframe_column_stats
 */
export type IGetDataframeColumnStatsResponse = IDataFrameColumnStats;

/**
 * Response for get_dataframe_rows.
 */
export type IGetDataframeRowsResponse = {
    rows: IDataFrameRow[];
    cursor: IGetDataframeRowsCursor;
};

/**
 * Cursor format for get_dataframe_rows.
 */
export type IGetDataframeRowsCursor = {
    rowIndex: number;
    inlineIndex: number;
    partialRow: string;
};

/**
 * Response for get_dependencies.
 */
export type IGetDependenciesResponse = IResolvedPackageDependencyMap;

export { sessionsPythonCode, dependenciesPythonCode, dataframePythonCode };
