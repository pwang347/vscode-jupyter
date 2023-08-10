/**
 * Code in Data Wrangler should always use LF line endings.
 *
 * This function can be used to convert CRLF line endings to LF.
 */
export function normalizeLineEndings(value: string) {
    return value.replace(/\r\n/g, "\n");
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not "equal" (according to a recursive call) between the arguments.
 * Returns true when the values of all keys are all equal.
 * If depth is <= 0, only performs a  strict equality check.
 *
 * Modified from https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/shallowEqual.js
 */
function checkEqual<T extends { [key: string]: any }>(objA: T, objB: T, depth: number): boolean {
    if (objA === objB) {
        return true;
    }

    if (depth <= 0) {
        return false;
    }

    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (const key of keysA) {
        if (!Object.hasOwnProperty.call(objB, key) || !checkEqual(objA[key], objB[key], depth - 1)) {
            return false;
        }
    }

    return true;
}

function checkTypeEqual<T extends { [key: string]: any }>(objA: T, objB: T, depth: number): boolean {
    if (objA === objB) {
        return true;
    }

    if (typeof objA !== "object" && typeof objB !== "object" && typeof objA === typeof objB) {
        return true;
    }

    if (objA === null || objB === null) {
        return false;
    }

    if (depth <= 0) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length === 0 || keysB.length === 0 || keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (const key of keysA) {
        if (!Object.hasOwnProperty.call(objB, key) || !checkTypeEqual(objA[key], objB[key], depth - 1)) {
            return false;
        }
    }

    return true;
}

/**
 * Tests for shallow equality between objects
 */
export function shallowEqual<T extends { [key: string]: any }>(objA: T, objB: T): boolean {
    return checkEqual(objA, objB, 1);
}

/**
 * Tests for deep equality between objects
 */
export function deepEqual<T extends { [key: string]: any }>(objA: T, objB: T): boolean {
    return checkEqual(objA, objB, Infinity);
}
/**
 * Tests for type equality between objects
 */
export function typeEqual<T extends { [key: string]: any }>(objA: T, objB: T): boolean {
    return checkTypeEqual(objA, objB, Infinity);
}
