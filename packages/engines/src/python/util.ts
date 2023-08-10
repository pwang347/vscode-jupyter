import { ColumnType } from "@dw/messaging";
import { escapeSingleQuote } from "../core/operations/util";

/**
 * Converts a JS primitive into a string representation of the corresponding Python value.
 * For example: `true` becomes `"True"`, and `'hello\nworld'` becomes `'"hello\\nworld"'`
 */
export function toPythonValueString(jsValue: any, type?: ColumnType) {
    if (jsValue === true) {
        return {
            value: "True"
        };
    } else if (jsValue === false) {
        return {
            value: "False"
        };
    }

    if (type === ColumnType.Datetime) {
        return {
            value: `datetime.strptime('${escapeSingleQuote(jsValue ?? "")}', '%Y-%m-%dT%H:%M:%S.%fZ')`,
            displayValue: jsValue,
            isDateTime: true
        };
    }

    return {
        value: JSON.stringify(jsValue)
    };
}

/**
 * Extracts a comment from the code.
 */
export function extractComment(code: string) {
    const commentRegex = /^\s*#\s*(.+)/;
    return commentRegex.exec(code)?.[1] ?? null;
}

/**
 * Returns true if the code has imports in it.
 */
export function codeHasImport(code: string) {
    return code.includes("import ");
}

/**
 * Returns true if the code has a function in it.
 */
export function codeHasFunction(code: string) {
    return code.includes("def ");
}

/**
 * Returns true if the code has a lambda function in it.
 */
export function codeHasLambda(code: string) {
    return code.includes("lambda ");
}
