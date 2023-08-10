import { INTERRUPTED_ERROR, AsyncTask, DeferredTask } from "@dw/messaging";
import * as assert from "assert";
import { IWranglerEngine } from "../engines";
import BatchedCodeExecutionQueue from "./batchedCodeExecutionQueue";

const mockEngine: Pick<IWranglerEngine, "getBatchedCode" | "interpretBatchedCode"> = {
    getBatchedCode: (codeToBatch) => {
        return codeToBatch.join("\n");
    },
    interpretBatchedCode: (result, promises) => {
        const splitResults = result.split("\n");
        for (let i = 0; i < promises.length; i++) {
            const value = splitResults[i];
            if (value.includes("error")) {
                promises[i].reject(value);
            } else {
                promises[i].resolve(value);
            }
        }
    }
};

let oldSetTimeout = setTimeout;
let oldClearTimeout = clearTimeout;

describe("Batched code execution queue", () => {
    let paused = true;
    const setTimerPaused = (pause: boolean) => (paused = pause);

    before(() => {
        (setTimeout as any) = (handler: () => void, timeout: number) => {
            if (paused) return;
            handler();
        };
        (clearTimeout as any) = () => {};
    });

    after(() => {
        (setTimeout as any) = oldSetTimeout;
        (clearTimeout as any) = oldClearTimeout;
    });

    beforeEach(() => {
        paused = true;
    });

    it("should batch requests", async () => {
        let current = { code: "", resolve(_: string) {} };
        const q = new BatchedCodeExecutionQueue(
            (code) => new AsyncTask(new Promise<string>((resolve) => (current = { code, resolve })), null, "test"),
            mockEngine as IWranglerEngine
        );

        let p1 = q.execute("1");
        let p2 = q.execute("2");
        let p3 = q.execute("3");
        setTimerPaused(false);
        let p4 = q.execute("4");

        assert.equal(current.code, "1\n2\n3\n4");
        current.resolve("1\nerror\n3\n4");
        assert.equal(await p1, "1");
        try {
            await p2;
            assert.fail("p2 should reject");
        } catch (e) {
            assert.equal(e, "error");
        }
        assert.equal(await p3, "3");
        assert.equal(await p4, "4");
    });

    it("should support cancelling queued tasks", async () => {
        let current = { code: "", resolve(_: string) {} };
        const q = new BatchedCodeExecutionQueue(
            (code) => new AsyncTask(new Promise<string>((resolve) => (current = { code, resolve })), null, "test"),
            mockEngine as IWranglerEngine
        );

        let p1 = q.execute("1");
        let p2 = q.execute("2");
        let p3 = q.execute("3");
        p3.interrupt();
        setTimerPaused(false);
        let p4 = q.execute("4");

        assert.equal(current.code, "1\n2\n4");
        current.resolve("1\n2\n4");
        assert.equal(await p1, "1");
        assert.equal(await p2, "2");
        try {
            await p3;
            assert.fail("Expected p3 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
        assert.equal(await p4, "4");
    });

    it("Should support cancelling the current batched task", async () => {
        let current: DeferredTask<string> | null = null;
        const q = new BatchedCodeExecutionQueue(
            // Note that the batched task must actually throw on interrupt in order for the error to bubble
            () => (current = new DeferredTask(() => current?.reject(INTERRUPTED_ERROR), "test")),
            mockEngine as IWranglerEngine
        );

        let p1 = q.execute("1");
        let p2 = q.execute("2");
        let p3 = q.execute("3");
        setTimerPaused(false);
        let p4 = q.execute("4");

        // if everything runs in a batch, interrupts are propagated
        p3.interrupt();
        try {
            await p1;
            assert.fail("Expected p1 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
        try {
            await p2;
            assert.fail("Expected p2 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
        try {
            await p3;
            assert.fail("Expected p3 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
        try {
            await p4;
            assert.fail("Expected p4 to be interrupted");
        } catch (e) {
            assert.equal(e, INTERRUPTED_ERROR);
        }
    });
});
