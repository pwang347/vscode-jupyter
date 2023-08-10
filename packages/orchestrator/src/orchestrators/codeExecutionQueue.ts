import {
    DeferredTask,
    ExecutionPriority,
    ICodeExecutorOptions,
    INTERRUPTED_ERROR,
    PriorityExecQueue
} from "@dw/messaging";
import { ICodeExecutionQueue } from "./types";

/**
 * A client-side queue for executing code in the kernel.
 * Using this instead of the kernel-side queue enables finer control over interrupts.
 *
 * creates `AsyncTask`s for each request and implements interrupt behavior.
 */
export default class CodeExecutionQueue implements ICodeExecutionQueue {
    private queue: PriorityExecQueue<{ code: string; options?: ICodeExecutorOptions }, string>;

    /**
     * @param execute    Function to execute code in the kernel. Should return the stdout as a string.
     * @param interrupt  Function to interrupt the kernel, stopping execution of the current request.
     */
    public constructor(
        execute: (code: string, options?: ICodeExecutorOptions) => Promise<string>,
        interrupt: () => Promise<void>
    ) {
        this.queue = new PriorityExecQueue(
            (item) => {
                let int: Promise<void> | null = null;
                const task = new DeferredTask<string>(async () => {
                    int = interrupt();

                    // Wait for the interrupt to complete before rejecting the task.
                    // This ensures that no other requests accidentally get interrupted.
                    await int;

                    task.reject(INTERRUPTED_ERROR);
                }, "exec");

                /**
                 * Resolve / reject the task after execution completes.
                 *
                 * If the task is interrupted, the interrupt flow above handles rejection.
                 * We do this because depending on the exact timing of the interrupt:
                 *   1. The request may not actually error out.
                 *   2. In rare cases, the execution request may be dropped completely and never resolve.
                 *
                 * In either of these cases we want to make sure that the task is rejected to notify parent tasks.
                 */
                execute(item.code, item.options).then(
                    (res) => !int && task.resolve(res),
                    (err) => !int && task.reject(err)
                );

                return task;
            },
            (item) => item.options?.priority ?? ExecutionPriority.NORMAL
        );
    }

    public execute = (code: string, options?: ICodeExecutorOptions) => {
        return this.queue.execute({ code, options });
    };

    public dispose() {
        return this.queue.interruptAll();
    }
}
