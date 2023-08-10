import {
    INTERRUPTED_ERROR,
    CodeExecutor,
    ExecutionPriority,
    ICodeExecutorOptions,
    AsyncTask,
    DeferredTask
} from "@dw/messaging";
import { IWranglerEngine } from "../engines";
import { ICodeExecutionQueue } from "./types";

interface PendingRequest {
    code: string;
    options?: ICodeExecutorOptions;
    task: DeferredTask<string>;
}

function getPriority(request: PendingRequest): ExecutionPriority {
    return request.options?.priority ?? ExecutionPriority.NORMAL;
}

interface IBatchedCodeExecutionQueueOptions {
    requestDebounceBatchTime: number;
}

/**
 * Code execution queue that batches requests.
 */
export default class BatchedCodeExecutionQueue implements ICodeExecutionQueue {
    private requests: Array<PendingRequest> = [];
    private batchedRequestsInFlight = new Set<AsyncTask<void>>();
    private batchedRequestTimeout: any;
    private options: IBatchedCodeExecutionQueueOptions;

    public constructor(
        private readonly executeRaw: CodeExecutor,
        private readonly engine: IWranglerEngine,
        options?: Partial<IBatchedCodeExecutionQueueOptions>
    ) {
        const defaultOptions = { batchRequests: false, requestDebounceBatchTime: 100 };
        this.options = { ...defaultOptions, ...options };
    }

    public execute = (code: string, options?: ICodeExecutorOptions) => {
        const task = new DeferredTask<string>(() => {
            const index = this.requests.indexOf(req);
            if (index >= 0) {
                this.requests.splice(index, 1);
            }
            req.task.reject(INTERRUPTED_ERROR);
            return req.task.interruptSubtasks();
        }, "batchQueue");

        if (options?.outputStream) {
            task.promise.then(
                // manually invoke the output stream on resolve/reject
                // we won't be able to collect the stream as it comes but at least
                // we make sure that it's called once so that any logs that expect can
                // receive it
                (value) => {
                    options.outputStream!(value);
                    return value;
                },
                (err) => {
                    options.outputStream!(err);
                    return err;
                }
            );
        }

        const req: PendingRequest = { code, options, task };
        this.enqueue(req);

        return task;
    };

    public async dispose() {
        if (this.batchedRequestsInFlight.size > 0) {
            for (const batchReq of this.batchedRequestsInFlight) {
                await batchReq.interrupt();
            }
            this.batchedRequestsInFlight.clear();
        }
    }

    private enqueue(req: PendingRequest) {
        clearTimeout(this.batchedRequestTimeout);
        this.requests.push(req);
        this.batchedRequestTimeout = setTimeout(() => this.runBatch(), this.options.requestDebounceBatchTime);
    }

    private async runOne(req: PendingRequest) {
        const exec = req.task
            .addSubtask(this.executeRaw(req.code, req.options))
            .then(req.task.resolve, req.task.reject);

        this.batchedRequestsInFlight.add(exec);
        await exec;
        this.batchedRequestsInFlight.delete(exec);
    }

    private async runBatch() {
        const batchedRequests = this.requests;
        this.requests = [];

        // in case we have 0 in the queue after cancelling, we should also return here with a no-op
        if (batchedRequests.length === 0) {
            return;
        }
        // if we have a single request, no need to batch
        if (batchedRequests.length === 1) {
            return this.runOne(batchedRequests[0]);
        }

        const batchedCode = this.engine.getBatchedCode(batchedRequests.map((req) => req.code));
        // Priority of the batch is the highest specified priority of the batched requests
        const batchPriority = batchedRequests.reduce<ExecutionPriority | undefined>(
            (max, req) => (max === undefined || getPriority(req) > max ? getPriority(req) : max),
            undefined
        );
        const execBatch = this.executeRaw(batchedCode, { priority: batchPriority }).then(
            (results) => {
                this.engine.interpretBatchedCode(
                    results,
                    batchedRequests.map((req) => req.task)
                );
            },
            (reason) => {
                for (const req of batchedRequests) {
                    req.task.reject(reason);
                }
            }
        );

        for (const req of batchedRequests) {
            // The batch request is a subtask of all pending requests.
            // TODO@DW: Should this subtask only be interrupted when all of its parents have been interrupted?
            req.task.addSubtask(execBatch);
        }

        this.batchedRequestsInFlight.add(execBatch);
        await execBatch;
        this.batchedRequestsInFlight.delete(execBatch);
    }
}
