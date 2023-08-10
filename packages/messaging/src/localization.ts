/**
 * Basic implementation of a string format operation for localization.
 */
export function formatString(base: string, ...args: any[]) {
    return base.replace(/{(\d+)}/g, (match, number) => (args[number] === undefined ? match : args[number]));
}
