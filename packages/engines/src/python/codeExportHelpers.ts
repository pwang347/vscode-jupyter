import { IHistoryItem, OperationKey } from "@dw/messaging";

/**
 * Get cleaned variable name with a counter, instead of duplicated _clean as suffix.
 */
export function getCleanedVarName(variableToWrangle: string) {
    let cleanedVarName: string = "";

    if (variableToWrangle.match(/^.*_clean(_\d+)?$/)) {
        if (variableToWrangle.match(/^.*_\d+$/)) {
            const digit = variableToWrangle.match(/\d+$/)?.toString();
            if (digit) {
                const next_digit = parseInt(digit) + 1;
                const end_index = variableToWrangle.length - digit.length;
                const sub_variableToWrangle = variableToWrangle.substring(0, end_index);
                cleanedVarName = sub_variableToWrangle.concat(next_digit.toString());
            }
        } else {
            cleanedVarName = variableToWrangle.concat("_1");
        }
    } else {
        cleanedVarName = variableToWrangle.concat("_clean");
    }

    return cleanedVarName;
}

export function buildCleaningCode(
    variableToWrangle: string,
    lineCommentPrefix: string,
    cleanedVarName: string,
    historyItems: IHistoryItem[],
    copy: boolean
): string {
    if (historyItems.length === 0) {
        return "";
    }

    // Operations, including imports in each operation
    const historyCodeItems = historyItems.map((historyItem) => {
        if (historyItem.code === "") {
            return [];
        }

        let code = historyItem.code;
        if (historyItem.operation.key !== OperationKey.CustomOperation) {
            code = `${lineCommentPrefix}${historyItem.description}\n${code}`;
        }

        return code.split("\n");
    });

    // Note: This is a very simple logic that doesn't account for multi-line imports (with a line ending with
    // backslash to continue on the next line), and doesn't take into account multi-line strings where a line
    // starts with one of these words by coincidence. Revisit if this turns out to be an issue.
    const isImportLine = (line: string) => line.trim().startsWith("import ") || line.trim().startsWith("from ");

    // Operations as arrays of lines, but without import statements
    const firstOperation = historyCodeItems[0].filter((line) => !isImportLine(line));
    const operations = historyCodeItems
        .slice(1)
        .flat()
        .filter((line) => !isImportLine(line));

    // Just the `import` lines, for all operations (including the first one)
    const imports = historyCodeItems
        .flat()
        .map((line) => line.trim())
        .filter(isImportLine);
    // Remove any duplicate imports and sort imports alphabetically
    const cleanedImports = Array.from(new Set<string>(imports)).sort((a, b) =>
        a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())
    );

    const indent = (line: string) => `    ${line}`;
    const newlineAfter = (lines: string[]) => (lines.length === 0 ? lines : [...lines, ""]);
    const buildFunction = (header: string, ...lines: string[]) => [header, ...lines.map(indent)];

    return [
        ...newlineAfter(cleanedImports),
        ...newlineAfter(
            buildFunction(
                `def clean_data(${variableToWrangle}):`,
                // TODO@DW: Add (properly localized) Python docstring to this Python function.

                // TODO@DW: it's a bit meaningless to export code without any operations. If the user tries to exit Data
                // Wrangler without any operations, we should show a confirmation dialog that asks if they're sure they
                // would like to leave the Data Wrangler without having done any operation on the data. This will be a
                // teachable moment for users who think that Data Wrangler is just a tool for viewing data, since this will
                // inform them that it's also possible to export. Another option is not to have the confirmation dialogue
                // but instead to add a Python comment at this point in the code genration (with proper localization)
                // that says something like "No operations defined. Did you accidentally exit the Data Wrangler before
                // performing operations to the data?"

                // TODO@DW: this will incorrectly add indentation to newlines in any multiline strings in an operation,
                // so we probably need some level of grammar parsing here.
                ...operations,
                `return ${variableToWrangle}`
            )
        ),
        ...newlineAfter(firstOperation),
        `${cleanedVarName} = clean_data(${variableToWrangle}${copy ? ".copy()" : ""})`
    ].join("\n");
}
