import { INTERRUPTED_ERROR, DeferredTask, PriorityExecQueue } from ".";
import * as assert from "assert";

interface ITestTask {
    code: string;
    priority: number;
}

describe("PriorityExecQueue", () => {
    it("should run tasks in order of priority, then FIFO", async () => {
        let current!: { item: ITestTask; task: DeferredTask<string> };
        const q = new PriorityExecQueue(
            (item: ITestTask) => {
                current = {
                    item,
                    task: new DeferredTask<string>(() => current.task!.reject(INTERRUPTED_ERROR), "test")
                };
                return current.task;
            },
            (item) => item.priority
        );

        let p1 = q.execute({ code: "1", priority: 1 });
        let p2 = q.execute({ code: "2", priority: -1 });
        let p3 = q.execute({ code: "3", priority: 1 });
        let p4 = q.execute({ code: "4", priority: 1 });

        assert.equal(current.item.code, "1");
        current.task.resolve("r1");
        assert.equal(await p1, "r1");

        assert.equal(current.item.code, "3");
        current.task.resolve("r3");
        assert.equal(await p3, "r3");

        assert.equal(current.item.code, "4");
        // If we insert a high priority task, it should be executed next.
        let p5 = q.execute({ code: "5", priority: 2 });
        current.task.resolve("r4");
        assert.equal(await p4, "r4");

        assert.equal(current.item.code, "5");
        current.task.resolve("r5");
        assert.equal(await p5, "r5");

        assert.equal(current.item.code, "2");
        current.task.resolve("r2");
        assert.equal(await p2, "r2");
    });

    it("should support cancelling queued tasks", async () => {
        let current!: { item: ITestTask; task: DeferredTask<string> };
        const q = new PriorityExecQueue(
            (item: ITestTask) => {
                current = {
                    item,
                    task: new DeferredTask<string>(() => current.task!.reject(INTERRUPTED_ERROR), "test")
                };
                return current.task;
            },
            (item) => item.priority
        );

        let p1 = q.execute({ code: "1", priority: 1 });
        let p2 = q.execute({ code: "2", priority: 1 });
        let p3 = q.execute({ code: "3", priority: 1 });
        let p4 = q.execute({ code: "4", priority: 1 });

        assert.equal(current.item.code, "1");
        p2.interrupt();
        current.task.resolve("r1");
        assert.equal(await p1, "r1");

        try {
            await p2;
            assert.fail("Expected p2 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }

        assert.equal(current.item.code, "3");
        p4.interrupt();
        current.task.resolve("r3");
        assert.equal(await p3, "r3");

        try {
            await p4;
            assert.fail("Expected p4 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
    });

    it("Should support cancelling the current task", async () => {
        let current!: { item: ITestTask; task: DeferredTask<string> };
        const q = new PriorityExecQueue(
            (item: ITestTask) => {
                current = {
                    item,
                    task: new DeferredTask<string>(() => current.task!.reject(INTERRUPTED_ERROR), "test")
                };
                return current.task;
            },
            (item) => item.priority
        );

        let p1 = q.execute({ code: "1", priority: 1 });
        let p2 = q.execute({ code: "2", priority: 1 });
        let p3 = q.execute({ code: "3", priority: 1 });
        let p4 = q.execute({ code: "4", priority: 1 });

        assert.equal(current.item.code, "1");
        current.task.resolve("r1");
        assert.equal(await p1, "r1");

        assert.equal(current.item.code, "2");
        await p2.interrupt();
        try {
            await p2;
            assert.fail("Expected p2 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }

        assert.equal(current.item.code, "3");
        current.task.resolve("r3");
        assert.equal(await p3, "r3");

        assert.equal(current.item.code, "4");
        p4.interrupt();
        try {
            await p4;
            assert.fail("Expected p4 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
    });
});
