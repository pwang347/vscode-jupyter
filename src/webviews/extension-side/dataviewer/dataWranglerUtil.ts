// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * This pattern matches ANSI sequences.
 * Taken from https://github.com/chalk/ansi-regex/blob/main/index.js
 */
export function ansiRegex({ onlyFirst = false } = {}) {
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
    ].join('|');

    return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

/**
 * We often get ANSI in error outputs from Jupyter, so make sure that we strip them out when displaying.
 * Taken from https://github.com/chalk/strip-ansi/blob/main/index.js
 */
export function stripAnsi(s: string) {
    if (typeof s !== 'string') {
        throw new TypeError(`Expected a \`string\`, got \`${typeof s}\``);
    }

    return s.replace(ansiRegex(), '');
}

export function cleanStackTrace(frames: string[]) {
    return frames.map((frame) =>
        frame
            .split('\n')
            .filter((line) => {
                const clean = stripAnsi(line);

                // TODO@DW: we should make sure that it's okay to just drop these lines from stack traces
                // for debugging errors, the full traces will always show up in the console still.
                if (clean.includes('__DW_') || clean.includes('exec("""')) {
                    return false;
                }
                return true;
            })
            .join('\n')
    );
}

/**
 * Removes ANSI from strings in an object in a deep fashion.
 * The object must be JSON serializable.
 */
export function stripAnsiDeep<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === 'string' ? stripAnsi(value) : value)));
}
