import { AsyncTask } from "./tasks";

/**
 * Output listener for a code executor.
 */
export type CodeOutputStreamListener = (output: string) => void;

/**
 * Given code, executes it and returns the stdout as a string.
 */
export type CodeExecutor = (code: string, options?: ICodeExecutorOptions) => AsyncTask<string>;

/**
 * Options for the code executor.
 */
export interface ICodeExecutorOptions {
    outputStream?: CodeOutputStreamListener;
    priority?: ExecutionPriority;
}

/**
 * Code execution priority.
 */
export enum ExecutionPriority {
    HIGH = 1,
    NORMAL = 0,
    LOW = -1
}
