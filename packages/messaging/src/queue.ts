import { INTERRUPTED_ERROR, DeferredTask, AsyncTask } from "./tasks";

interface PendingRequest<TIn, TOut> {
    item: TIn;
    task: DeferredTask<TOut>;
}

/**
 * Implements a priority queue for `AsyncTask`s. Tasks run one at a time, in priority order (highest priority first).
 * Tasks with the same priority are run in FIFO order.
 *
 * Handles interrupts from queued and running tasks,
 * and enables interrupting the currently running task or all tasks at once.
 */
export class PriorityExecQueue<TIn, TOut> {
    // The queue data. Sorted in high -> low order of priority.
    private queue: Array<PendingRequest<TIn, TOut>> = [];

    private currentRequest: PendingRequest<TIn, TOut> | null = null;

    public constructor(
        private readonly executeItem: (item: TIn) => AsyncTask<TOut>,
        private readonly getPriority?: (item: TIn) => number,
        private readonly name = "queue"
    ) {}

    public execute(item: TIn) {
        const task = new DeferredTask<TOut>(async () => {
            this.queue = this.queue.filter((t) => t !== req);

            if (this.currentRequest === req) {
                await req.task.interruptSubtasks();
            } else {
                req.task.reject(INTERRUPTED_ERROR);
            }
        }, this.name);

        const req: PendingRequest<TIn, TOut> = { item, task };
        this.queue.push(req);
        if (this.getPriority) {
            this.queue.sort((a, b) => this.getPriority!(b.item) - this.getPriority!(a.item));
        }
        void this.check();

        return task;
    }

    /**
     * Interrupts the currently running task, if any.
     */
    public async interrupt() {
        if (this.currentRequest) {
            await this.currentRequest.task.interrupt();
        }
    }

    /**
     * Interrupts all queued and running tasks.
     */
    public async interruptAll() {
        for (const req of this.queue) {
            req.task.reject(INTERRUPTED_ERROR);
        }
        this.queue = [];

        if (this.currentRequest) {
            await this.currentRequest.task.interrupt();
        }
    }

    private async check() {
        if (!this.currentRequest) {
            while (this.queue.length > 0) {
                this.currentRequest = this.queue.shift()!;
                const { task, item } = this.currentRequest;
                await task.addSubtask(this.executeItem(item)).then(task.resolve, task.reject);
            }
            this.currentRequest = null;
        }
    }
}
