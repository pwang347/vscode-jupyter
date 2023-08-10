import { v4 as uuidv4 } from "uuid";

/**
 * Generates a unique arg key.
 */
export function generateArgKey(prefix: string): string {
    return `${prefix}-${uuidv4()}`;
}

/**
 * Adds unique keys to args that need them.
 * Helps React to render the args correctly after updates.
 */
export type ArgsRecursiveChildren = {
    [key: string]: any;
    children?: { [key: string]: ArgsRecursiveChildren | any }[];
};
export function addUniqueKeyToArgs(args: ArgsRecursiveChildren, prefix: string): any {
    // If it has children, add UUIDs to them
    if (args.children) {
        args.children = args.children.map((child) => {
            const keys = Object.keys(child);
            keys.forEach((key) => {
                if (!child[key] || typeof child[key] !== "object") {
                    return;
                }
                if (child[key].children) {
                    child[key] = addUniqueKeyToArgs(child[key], prefix);
                } else if (!child[key].key) {
                    child[key].key = generateArgKey(prefix);
                }
            });
            return child;
        });
    }
    return args;
}
