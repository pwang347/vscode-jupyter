import { TaskStatus } from "./tasks";

/**
 * We do some cleanup of traces before logging to cut down on the data size.
 * Specifically:
 *   - Start and end times are made relative to the start of the root task
 *   - Status is omitted if the task was successful
 *   - Children are only specified if at least one child is present
 *
 * This is the base class of `IPerfTrace` to ensure compatibility.
 */
export interface ICleanedPerfTrace {
    name: string;
    start: number;
    end?: number;
    status?: TaskStatus;
    children?: ICleanedPerfTrace[];
}

/** Perf trace results for a task. */
export interface IPerfTrace extends ICleanedPerfTrace {
    status: TaskStatus;
    children: IPerfTrace[];
}

/**
 * Cleans the given perf trace for use in telemetry.
 */
export function cleanPerfTrace(trace: IPerfTrace, start = trace.start): ICleanedPerfTrace {
    return {
        name: trace.name,
        start: trace.start - start,
        end: trace.end && trace.end - start,
        status: trace.status === "success" ? undefined : trace.status,
        children: trace.children.length === 0 ? undefined : trace.children.map((c) => cleanPerfTrace(c, start))
    };
}

/**
 * Calculates the amount of time used during a trace, excluding times when at least one subtask was running.
 */
export function getPerfTraceSelfTime(trace: ICleanedPerfTrace) {
    // The maximum timestamp we've seen so far where a subtask was running.
    let currMax = trace.start;

    // The total time we've seen so far where no subtask was running.
    let totalTime = 0;

    // Sort the children by start time
    const sorted = trace.children ? [...trace.children].sort((a, b) => a.start - b.start) : [];
    for (const child of sorted) {
        if (child.start > currMax) {
            totalTime += child.start - currMax;
        }
        if (!child.end) {
            // The task never finished -- count it as taking the entire time and stop here.
            currMax = Infinity;
            break;
        }
        if (child.end > currMax) {
            currMax = child.end;
        }
    }

    if (trace.end && trace.end > currMax) {
        totalTime += trace.end - currMax;
    }

    return totalTime;
}

export function prettyPrintPerfTrace(trace: ICleanedPerfTrace): string {
    return formatTable(getTraceTable(trace));
}

interface ITableColumn {
    content: string;
    before?: string;
    after?: string;
}
interface ITableRow {
    columns: ITableColumn[];
    before: string;
    after: string;
}
interface ITableColumnDef {
    name: string;
    fill?: {
        align: "left" | "right";
        before?: string;
        after?: string;
        fill?: string;
    };
    before?: string;
    after?: string;
}
interface ITable {
    rows: ITableRow[];
    columns: ITableColumnDef[];
}

function formatTable(table: ITable) {
    const widths = table.columns.map((c, i) => {
        return c.fill ? Math.max(c.name.length, ...table.rows.map((r) => r.columns[i].content.length)) : 0;
    });
    const headerRow: ITableRow = {
        columns: table.columns.map(({ name }) => ({ content: name })),
        before: "\x1B[1;4m", // bold, underline
        after: "\x1B[22;24m" // bold off, underline off
    };

    return [headerRow, ...table.rows]
        .map(
            ({ before, columns, after }) =>
                before +
                columns
                    .map(({ content, before = "", after = "" }, i) => {
                        const { fill, before: beforeAll = "", after: afterAll = "" } = table.columns[i];
                        if (fill) {
                            const padding =
                                (fill.before || "") +
                                (fill.fill || " ")[0].repeat(widths[i] - content.length) +
                                (fill.after || "");
                            content = fill.align === "left" ? content + padding : padding + content;
                        }
                        return beforeAll + before + content + after + afterAll;
                    })
                    .join("") +
                after
        )
        .join("\n");
}

function getTraceTable(trace: ICleanedPerfTrace): ITable {
    const rows = Array.from(getTraceRows(trace));

    return {
        rows,
        columns: [
            { name: "self", fill: { align: "right" } },
            {
                name: "name",
                fill: {
                    align: "left",
                    fill: ".",
                    before: "\x1B[37m ", // fg gray
                    after: " \x1B[39m" // fg reset
                },
                before: " "
            },
            { name: "start", fill: { align: "right" } },
            { name: "end", fill: { align: "right" }, before: " - " },
            { name: "total", fill: { align: "right" }, before: " (", after: ")" },
            { name: "", before: " " } // Icon
        ]
    };
}

function* getTraceRows(
    trace: ICleanedPerfTrace,
    start = trace.start,
    end = trace.end,
    firstPrefix = "",
    restPrefix = ""
): IterableIterator<ITableRow> {
    const selfTime = trace.end ? getPerfTraceSelfTime(trace) : 0;
    const selfTimePct = end === undefined ? 0 : selfTime / (end - start);

    yield {
        columns: [
            {
                content: selfTime ? selfTime + "ms" : "",
                before:
                    selfTimePct > 0.15
                        ? "\x1B[1;31m" // bold, fg red
                        : selfTimePct > 0.02
                        ? "\x1B[1;33m" // bold, fg orange
                        : "",
                after: "\x1B[22;39m" // bold off, fg reset
            },
            { content: firstPrefix + trace.name },
            { content: trace.start - start + "" },
            { content: trace.end ? trace.end - start + "" : "?" },
            { content: trace.end ? trace.end - trace.start + "ms" : "?" },
            { content: getTraceRowIcon(trace) }
        ],
        before: getTraceRowColor(trace),
        after: "\x1B[0m" // reset all
    };

    if (trace.children) {
        for (let i = 0; i < trace.children.length; i++) {
            const isLast = i === trace.children.length - 1;
            yield* getTraceRows(
                trace.children[i],
                start,
                end,
                restPrefix + (isLast ? "└ " : "├ "),
                restPrefix + (isLast ? "  " : "│ ")
            );
        }
    }
}

function getTraceRowColor(trace: ICleanedPerfTrace) {
    switch (trace.status) {
        case "interrupted":
            return "\x1B[48;2;255;255;220m"; // bg #FFFFDC (yellow)
        case "error":
            return "\x1B[48;2;255;220;220m"; // bg #FFDCDC (red)
        case "running":
            return "\x1B[48;2;220;255;255m"; // bg #DCFFFF (cyan)
        default:
            return "";
    }
}

function getTraceRowIcon(trace: ICleanedPerfTrace) {
    switch (trace.status) {
        case "interrupted":
            return "⚠️";
        case "error":
            return "❌";
        case "running":
            return "🕒";
        default:
            return "";
    }
}
