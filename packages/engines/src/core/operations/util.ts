import {
    formatString,
    getTargetableColumnNames,
    IColumnTarget,
    IDataFrame,
    IDataFrameHeader,
    PreviewAnnotationType
} from "@dw/messaging";
import { LocalizedStrings } from "@dw/orchestrator";

/**
 * See https://stackoverflow.com/a/1144788 for motivation. We want to perform a global replace
 * but don't want to treat this replacement as regex, only literal replacements.
 *
 * We want to double escape if the escaped string is itself to be in a string.
 */
export function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Helper to add a '\' before characters that should be escaped.
 */
export function escapeCharactersInString(value: string, escapedChar: string) {
    return value.replace(new RegExp(`[${escapeRegExp(escapedChar)}]`, "g"), "\\$&");
}

/**
 * This helper is needed since we sometimes have nested quotes.
 * For example, if a column name has a single quote, e.g. 'hello', when we attempt to access it
 * e.g. df[''hello''] this will become invalid syntax. Instead, we want to produce code that looks
 * like df['\'hello\'']
 */
export function escapeSingleQuote(value: string) {
    return escapeCharactersInString(value, "\\'");
}

/**
 * If we have a string like "%sales" then we want to make sure that when we concat
 * template strings to it we are escaping the %s properly -> "%%sales" would be rendered
 * literally as "%sales" and ignored for any text substitutions.
 */
export function escapeTemplateString(text: string) {
    return text.replace(/%/g, "%%");
}

/**
 * Performs sanitization on a list of column names.
 */
export function sanitizeColumnNames(...columnNames: string[]) {
    const seenCounter: { [key: string]: number } = {};
    // we need to make sure the column names have the following properties:
    // 1. they don't need to have the _index suffix unless required for uniqueness (see #3)
    // 2. they need to be valid python variable names, as we intend to use them as parameter names
    // 3. they should be unique, so we can ensure uniqueness ourselves
    // in the worst case, if we had a list of columns made up completely of non-standard symbols we
    // can just represent them as col, col_2, and so on.
    const newColumnNames = columnNames.map((name) => {
        let formatted = name.replace(/_\d+$/, "");
        formatted = formatted.replace(/[^a-zA-Z0-9_]/g, "");
        if (/^\d/.test(formatted) || formatted === "") {
            formatted = "col" + formatted;
        }
        if (!(formatted in seenCounter)) {
            seenCounter[formatted] = 0;
        }
        seenCounter[formatted] += 1;
        return seenCounter[formatted] > 1 ? `${formatted}_${seenCounter[formatted]}` : formatted;
    });

    return newColumnNames;
}

/**
 * Checks whether a given column name already exists in the data frame (before preview).
 */
export function doesColumnNameExistInNonPreviewState(dataframe: IDataFrame, colName: string) {
    const column = dataframe.columns.find((col) => col.name === colName);
    // Column name does not exist.
    if (!column) {
        return false;
    }
    // Column name exists. Return false only if the column has been added.
    return column.annotations?.annotationType !== PreviewAnnotationType.Added;
}

/**
 * Returns true if the column target matches all the targetable columns.
 */
export function isTargetingAllColumns(dataFrame: IDataFrameHeader, columns: IColumnTarget[]) {
    return getTargetableColumnNames(dataFrame, false).length === columns.length;
}

/**
 * Returns a string with the column names.
 */
export function formatColumnNamesInDescription(
    columnNames: string[],
    locStrings: typeof LocalizedStrings.Orchestrator
) {
    if (columnNames.length <= 3) {
        return columnNames.join(", ");
    }
    return formatString(locStrings.MultipleColumnsFormat, columnNames[0], columnNames[1], columnNames.length - 2);
}
