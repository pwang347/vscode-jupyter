import { AsyncTask, DeferredTask, INTERRUPTED_ERROR } from "./tasks";
import * as assert from "assert";
import { IPerfTrace } from "./trace";

describe("AsyncTask tests", () => {
    const neverResolve = () => {
        const task: DeferredTask<void> = new DeferredTask(() => task.reject(INTERRUPTED_ERROR), "neverResolve");
        return task;
    };

    function scrubTraceTimes(trace: IPerfTrace) {
        trace.start = 0;
        if (trace.end) {
            trace.end = 0;
        }
        trace.children.forEach(scrubTraceTimes);
    }

    describe("AsyncTask tests", () => {
        it("Can create and interrupt an AsyncTask using a Promise", async () => {
            let reject!: (reason?: any) => void;
            const task = new AsyncTask(
                new Promise((res, rej) => {
                    reject = rej;
                }),
                () => reject(INTERRUPTED_ERROR),
                "test"
            );

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            await task.interrupt();

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "interrupted");

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }
        });

        it("Can create and resolve an AsyncTask using a Promise", async () => {
            let resolve!: (value: string) => void;
            let reject!: (reason?: any) => void;
            const task = new AsyncTask(
                new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                }),
                () => reject(INTERRUPTED_ERROR),
                "test"
            );

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            resolve("test");

            assert.equal(await task, "test");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can create and reject an AsyncTask using a Promise", async () => {
            let resolve!: (value: string) => void;
            let reject!: (reason?: any) => void;
            const task = new AsyncTask(
                new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                }),
                () => reject(INTERRUPTED_ERROR),
                "test"
            );

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            reject("test");

            try {
                await task;
                assert.fail("Expected task to be error");
            } catch (e) {
                assert.equal(e, "test");
            }

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "error");
        });

        it(".then() creates a new task that can handle success", async () => {
            // Use a DeferredTask for simplicity.
            const task: DeferredTask<string> = new DeferredTask(() => task.reject("interrupt"), "test");

            const then = task.then(
                (value) => value + " success",
                (err) => err + " error"
            );

            assert.equal(then.isDone(), false);
            assert.equal(then.status(), "running");

            task.resolve("test");

            assert.equal(await task, "test");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");

            assert.equal(await then, "test success");
            assert.equal(then.isDone(), true);
            assert.equal(then.status(), "success");
        });

        it(".then() creates a new task that can handle errors", async () => {
            // Use a DeferredTask for simplicity.
            const task: DeferredTask<string> = new DeferredTask(() => task.reject("interrupt"), "test");

            const then = task.then(
                (value) => value + " success",
                (err) => err + " error"
            );

            assert.equal(then.isDone(), false);
            assert.equal(then.status(), "running");

            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, "interrupt");
            }

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "error");

            assert.equal(await then, "interrupt error");
            assert.equal(then.isDone(), true);
            assert.equal(then.status(), "success");
        });
    });

    describe("AsyncTask.resolve tests", () => {
        it("Can create an empty task", async () => {
            const task = AsyncTask.resolve();

            assert.equal(await task, undefined);
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can wrap a resolving Promise", async () => {
            const task = AsyncTask.resolve(Promise.resolve("test"));

            assert.equal(await task, "test");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can wrap a rejecting Promise", async () => {
            const task = AsyncTask.resolve(Promise.reject("test"));

            try {
                await task;
                assert.fail("Expected task to be error");
            } catch (e) {
                assert.equal(e, "test");
            }

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "error");
        });

        it("Returns AsyncTasks without modification", async () => {
            const innerTask = AsyncTask.resolve("test");
            const task = AsyncTask.resolve(innerTask);

            assert.equal(task, innerTask);
        });
    });

    describe("AsyncTask.factory tests", () => {
        it("Creates a function that returns tasks", async () => {
            const foo = AsyncTask.factory("foo", async (_, arg: string) => arg + " foo");

            const task = foo("test");

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            assert.equal(await task, "test foo");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can nest subtasks", async () => {
            const foo = AsyncTask.factory("foo", async (_, arg: string) => arg + " foo");
            const bar = AsyncTask.factory("bar", async (subtask, arg: string) => {
                const res = await subtask(foo(arg));
                return res + " bar";
            });

            const task = bar("test");

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            assert.equal(await task, "test foo bar");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can interrupt nested subtasks", async () => {
            const foo = AsyncTask.factory("foo", async (subtask) => {
                await subtask(neverResolve());
            });

            const task = foo();

            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "interrupted");
        });

        it("Can handle interrupted subtasks", async () => {
            const foo = AsyncTask.factory("foo", async (subtask) => {
                try {
                    await subtask(neverResolve());
                } catch (e) {
                    if (e !== INTERRUPTED_ERROR) {
                        throw e;
                    }
                }
                return "success";
            });

            const task = foo();

            await task.interrupt();

            assert.equal(await task, "success");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });
    });

    describe("DeferredTask tests", () => {
        it("Can create and interrupt a DeferredTask", async () => {
            const task: DeferredTask<void> = new DeferredTask(() => task.reject(INTERRUPTED_ERROR), "test");

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "interrupted");
        });

        it("Can create and resolve a DeferredTask", async () => {
            const task: DeferredTask<string> = new DeferredTask(() => task.reject(INTERRUPTED_ERROR), "test");

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            task.resolve("test");

            assert.equal(await task, "test");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can create and reject a DeferredTask", async () => {
            const task: DeferredTask<string> = new DeferredTask(() => task.reject(INTERRUPTED_ERROR), "test");

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            task.reject("test");

            try {
                await task;
                assert.fail("Expected task to be error");
            } catch (e) {
                assert.equal(e, "test");
            }

            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "error");
        });

        it("Can add subtasks to a DeferredTask and succeed", async () => {
            const task: DeferredTask<string> = new DeferredTask(() => task.interruptSubtasks(), "test");
            const subtask: DeferredTask<string> = new DeferredTask(() => subtask.reject(INTERRUPTED_ERROR), "test");

            task.addSubtask(
                subtask.then(
                    (value) => task.resolve(value + " success"),
                    (err) => task.resolve(err + " error")
                )
            );

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            subtask.resolve("test");

            assert.equal(await task, "test success");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });

        it("Can add subtasks to a DeferredTask and interrupt", async () => {
            const task: DeferredTask<string> = new DeferredTask(() => task.interruptSubtasks(), "test");
            const subtask: DeferredTask<string> = new DeferredTask(() => subtask.reject("interrupted"), "test");

            task.addSubtask(
                subtask.then(
                    (value) => task.resolve(value + " success"),
                    (err) => task.resolve(err + " error")
                )
            );

            assert.equal(task.isDone(), false);
            assert.equal(task.status(), "running");

            await task.interrupt();

            try {
                await subtask;
                assert.fail("Expected subtask to be interrupted");
            } catch (e) {
                assert.equal(e, "interrupted");
            }

            assert.equal(await task, "interrupted error");
            assert.equal(task.isDone(), true);
            assert.equal(task.status(), "success");
        });
    });

    describe("Trace tests", () => {
        it("Simple finished trace", async () => {
            const task = AsyncTask.resolve("test");

            await task;

            const trace = task.trace();
            scrubTraceTimes(trace);

            assert.deepStrictEqual(trace, {
                name: "<anonymous>",
                status: "success",
                start: 0,
                end: 0,
                children: []
            });
        });

        it("Simple in-progress trace", async () => {
            const task = new AsyncTask(new Promise(() => {}), null, "test");

            const trace = task.trace();
            scrubTraceTimes(trace);

            assert.deepStrictEqual(trace, {
                name: "test",
                status: "running",
                start: 0,
                end: undefined,
                children: []
            });
        });

        it("Nested trace", async () => {
            const foo = AsyncTask.factory("foo", async (_, arg: string) => arg + " foo");
            const bar = AsyncTask.factory("bar", async (subtask, arg: string) => {
                const res = await subtask(foo(arg));
                return res + " bar";
            });

            const task = bar("test");

            await task;

            const trace = task.trace();
            scrubTraceTimes(trace);

            assert.deepStrictEqual(trace, {
                name: "bar",
                status: "success",
                start: 0,
                end: 0,
                children: [
                    {
                        name: "foo",
                        status: "success",
                        start: 0,
                        end: 0,
                        children: []
                    }
                ]
            });
        });
    });
});
