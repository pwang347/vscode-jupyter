import * as assert from "assert";

import CodeExecutionQueue from "./codeExecutionQueue";
import { INTERRUPTED_ERROR } from "@dw/messaging";

describe("codeExecutionQueue", () => {
    describe("Interrupt tests", () => {
        it("Should allow execution to be interrupted", async () => {
            let resolve!: (value: string) => void;
            let reject!: (reason?: any) => void;
            const queue = new CodeExecutionQueue(
                (code) =>
                    new Promise((res, rej) => {
                        resolve = res;
                        reject = rej;
                    }),
                async () => {
                    // Simulate a kernel interrupt scenario by rejecting the promise that represents the executing code
                    // Note that this is not the actual error that will be thrown.
                    // Interrupts _always_ throw INTERRUPTED_ERROR.
                    reject("Error message");
                }
            );

            const task = queue.execute("1");
            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }
        });

        it("Should be interrupted even if execution does not finish", async () => {
            let resolve!: (value: string) => void;
            let reject!: (reason?: any) => void;
            const queue = new CodeExecutionQueue(
                (code) =>
                    new Promise((res, rej) => {
                        resolve = res;
                        reject = rej;
                    }),
                async () => {
                    // No-op, simulating a kernel interrupt that didn't actually stop the executing code
                }
            );

            const task = queue.execute("1");
            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }
        });

        it("Interrupt should override resolution", async () => {
            let resolve!: (value: string) => void;
            let reject!: (reason?: any) => void;
            const queue = new CodeExecutionQueue(
                (code) =>
                    new Promise((res, rej) => {
                        resolve = res;
                        reject = rej;
                    }),
                async () => {
                    // No-op
                }
            );

            const task = queue.execute("1");

            resolve("r1");
            await task.interrupt();

            try {
                await task;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }
        });

        it("Should wait for an interrupt to finish before executing the next request", async () => {
            const tasks: Array<{
                resolve: (value: string) => void;
                reject: (reason?: any) => void;
            }> = [];
            const queue = new CodeExecutionQueue(
                (code) =>
                    new Promise((resolve, reject) => {
                        tasks.push({ resolve, reject });
                    }),
                async () => {
                    // Give plenty of time for the queue to try to run the next task (if broken)
                    await new Promise((res) => setTimeout(res, 100));
                }
            );

            const task1 = queue.execute("1");
            const task2 = queue.execute("2");

            await task1.interrupt();

            try {
                await task1;
                assert.fail("Expected task to be interrupted");
            } catch (e) {
                assert.equal(e, INTERRUPTED_ERROR);
            }

            tasks[1].resolve("r2");
            assert.equal(await task2, "r2");
        });
    });
});
