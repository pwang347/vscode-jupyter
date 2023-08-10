import { AsyncTask, PriorityExecQueue } from "@dw/messaging";

/**
 * Helper class to queue multiple asynchronous calls to run in sequence.
 */
export class SynchronousExecQueue extends PriorityExecQueue<() => AsyncTask<void>, void> {
    exec = this.execute;
    public constructor() {
        super((item) => item());
    }
}
