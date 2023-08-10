import { IPerfTrace, prettyPrintPerfTrace } from "./trace";

/** Activity status of a task. */
export type TaskStatus = "running" | "interrupted" | "success" | "error";

/**
 * Signature for the `subtask` helper function.
 * Requires a name to be provided for subtasks that are not already an `AsyncTask`.
 */
export type SubtaskInvoker = {
    <T>(p: AsyncTask<T>, name?: string): AsyncTask<T>;
    <T>(p: PromiseLike<T> | T, name: string): AsyncTask<T>;
};

/**
 * Represents an asynchronous task.
 *
 * Tasks can be interrupted and can track subtasks.
 *
 * They also provide performance tracing functionality for monitoring the timing of nested tasks.
 */
export class AsyncTask<T> implements PromiseLike<T> {
    // Don't initialize these until they are needed, to avoid unnecessary allocations and keep tasks lightweight.
    private subtasks?: Array<{
        task: AsyncTask<unknown>;
        nameOverride?: string;
    }>;
    private _status?: TaskStatus; // Set when the task completes. Implicitly "running" until then.
    private endTime?: number;

    /**
     * Creates a new AsyncTask.
     *
     * @param promise      The Promise (or Promise-like) representing the asynchronous task.
     * @param onInterrupt  Handles interrupt of the given promise. Subtasks will be automatically interrupted prior to invoking this.
     * @param name         A name for the task. Used in traces.
     * @param startTime    The timestamp when this task started. If not provided, defaults to now.
     */
    public constructor(
        public readonly promise: PromiseLike<T>,
        private readonly onInterrupt: (() => void | Promise<void>) | null,
        public readonly name: string,
        private readonly startTime = Date.now()
    ) {
        this.promise.then(
            () => {
                this._status = "success";
                this.endTime = Date.now();
            },
            (e) => {
                this._status = e === INTERRUPTED_ERROR ? "interrupted" : "error";
                this.endTime = Date.now();
            }
        );
    }

    public interrupt() {
        // Don't try to interrupt if the task is already complete.
        if (this.isDone()) {
            return;
        }

        if (this.onInterrupt) {
            return this.onInterrupt();
        }
    }

    public isDone() {
        return this._status !== undefined;
    }

    public status(): TaskStatus {
        return this._status ?? "running";
    }

    public trace() {
        let res: IPerfTrace = {
            name: this.name,
            start: this.startTime,
            end: this.endTime,
            status: this.status(),
            children: []
        };

        if (this.subtasks) {
            for (const subtask of this.subtasks) {
                let subtrace = subtask.task.trace();

                if (subtask.nameOverride) {
                    subtrace.name = subtask.nameOverride;
                } else if (subtrace.name.startsWith("__")) {
                    res.children.push(...subtrace.children);
                    continue;
                }

                res.children.push(subtrace);
            }
        }

        return res;
    }

    /**
     * Task equivalent to `Promise.then()`.
     *
     * Note: this method signature is copied from the `PromiseLike` interface (with a modified return type).
     */
    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ): AsyncTask<TResult1 | TResult2> {
        // `.then()` essentially creates a new *parent* task that wraps this task.
        // So we create a new task, add this as a subtask, and return that.
        const task = new AsyncTask(
            this.promise.then(onfulfilled, onrejected),
            () => this.interrupt(),
            "__then", // Special name. Tasks starting with "__" are replaced by their children in traces.
            this.startTime // The parent task started when this task did, not necessarily when it was created.
        );

        task.addSubtask(this);

        return task;
    }

    /**
     * Creates a simple wrapper around this task.
     *
     * Useful for keeping clean traces when a function simply returns another task.
     */
    public withName(name: string) {
        const task = new AsyncTask<T>(this.promise, this.onInterrupt, name, this.startTime);
        task.addSubtask(this);
        return task;
    }

    /**
     * Adds some handling to be done after this task is complete. Does not create a new task.
     */
    public finally(cb: (success: boolean) => void) {
        this.promise.then(
            () => cb(true),
            () => cb(false)
        );
    }

    public toString() {
        return prettyPrintPerfTrace(this.trace());
    }

    protected addSubtask<T extends AsyncTask<unknown>>(subtask: T, nameOverride?: string): T {
        if (!this.subtasks) {
            this.subtasks = [];
        }

        this.subtasks.push({
            task: subtask,
            nameOverride
        });

        return subtask;
    }

    protected interruptSubtasks() {
        if (this.subtasks) {
            return Promise.all(this.subtasks.map((s) => s.task.interrupt())).then<void>();
        }
    }

    /**
     * Wraps a function to make it return tasks.
     * This includes the ability to add sub-tasks via the `subtask()` function.
     */
    public static factory<This, Args extends any[], Return>(
        name: string,
        asyncFunc: (this: This, subtask: SubtaskInvoker, ...args: Args) => PromiseLike<Return>,
        options: {
            onCreate?: (this: This, task: AsyncTask<Return>, args: Args) => void;
        } = {}
    ): (this: This, ...args: Args) => AsyncTask<Return> {
        return function (this, ...args) {
            const task: DeferredTask<Return> = new DeferredTask(() => task.interruptSubtasks(), name);
            const subtask: SubtaskInvoker = (subtask, subtaskName) =>
                task.addSubtask(AsyncTask.resolve(subtask, subtaskName), subtaskName);

            // Note that we need to use a deferred task so `subtask` can reference it.
            asyncFunc.call(this, subtask, ...args).then(task.resolve, task.reject);

            if (options.onCreate) {
                options.onCreate.call(this, task, args);
            }

            return task;
        };
    }

    public static resolve(): AsyncTask<void>;
    public static resolve<T>(value: T, name?: string): AsyncTask<Awaited<T>>;
    public static resolve<T extends AsyncTask<unknown>>(value: T): T;
    public static resolve<T>(value?: T, name = "<anonymous>") {
        // TODO@DW: If AsyncTask is defined in multiple bundles, we could end up with multiple instance of the class
        // and this check would fail. We should maybe do a brand check here instead (for example using Symbol.for())
        if (value instanceof AsyncTask) {
            return value;
        }
        return new AsyncTask(Promise.resolve(value), null, name);
    }
}

/**
 * Simpler wrapper class around AsyncTask that exposes `resolve()` and `reject()` methods from the underlying Promise.
 *
 * It also exposes subtask management methods, giving callers full control over the task's lifecycle.
 */
export class DeferredTask<T> extends AsyncTask<T> {
    public readonly resolve!: (value: T) => void;
    public readonly reject!: (err: unknown) => void;

    public constructor(onInterrupt: (() => void | Promise<void>) | null, name: string) {
        let resolve!: (value: T) => void;
        let reject!: (err: unknown) => void;
        super(
            new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
            }),
            onInterrupt,
            name
        );
        this.resolve = resolve;
        this.reject = reject;
    }
}

// Make `addSubtask` and `interruptSubtasks` visible on DeferredTask.
export interface DeferredTask<T> {
    addSubtask: AsyncTask<T>["addSubtask"];
    interruptSubtasks: AsyncTask<T>["interruptSubtasks"];
}

/** Common error that may be used to indicate a task has been interrupted. */
export const INTERRUPTED_ERROR = new Error("Interrupted");
