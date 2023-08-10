import { CodeExecutor } from "@dw/messaging";

/**
 * A code execution queue.
 */
export interface ICodeExecutionQueue {
    execute: CodeExecutor;
    dispose: () => Promise<void>;
}
