import {
    PreviewAnnotationType,
    IDataFrameRow,
    AsyncTask,
    IResolvedPackageDependencyMap,
    CodeExecutor,
    ICodeExecutorOptions,
    ExecutionPriority
} from "@dw/messaging";
import { IPackageDependencyMap, PreviewStrategy } from "@dw/orchestrator";
import { PythonPackageInstallers } from "../types";
import {
    sessionsPythonCode,
    dataframePythonCode,
    dependenciesPythonCode,
    IGetDataframeInfoResponse,
    IGetDataframeHeaderStatsResponse,
    IGetDataframeColumnStatsResponse,
    IGetDataframeRowsResponse,
    IGetDataframeRowsCursor
} from "./types";
import { toByteArray } from "base64-js";

/**
 * Given operation code, executes it in an isolated environment.
 *
 * We want to contain our changes to a locals dictionary, but passing it in regularly for `exec` leads to wonky scoping behaviour.
 * See https://stackoverflow.com/questions/31971588/python-lambdaexec-scope-error
 *
 * Instead, we update the scope directly with the `locals()` and merge it in the mocked globals() dictionary.
 * The fundamental assumption here is that if people wanted to tamper with globals, then there's not much we
 * could do to stop it.
 *
 * However, we preserve the following two capabilities:
 *  - Isolation across wrangling sessions on the same file
 *  - Not polluting / overwriting the global namespace
 */
export const getIsolatedOperationCode = (sessionId: string, code: string) => {
    const isolatedCode = `
exec("""
${
    // escape the code to prevent injections
    code.replace(/[\\"]/g, "\\$&")
}
__DW_SCOPE__["${sessionId}"]["locals"].update(locals())
""", {**globals(), **__DW_SCOPE__["${sessionId}"]["locals"]})
`;
    return isolatedCode;
};

export const executeIsolatedOperation = (
    executeCode: CodeExecutor,
    sessionId: string,
    code: string,
    options?: ICodeExecutorOptions
) => {
    const isolatedCode = getIsolatedOperationCode(sessionId, code);
    return executeCode(isolatedCode, options);
};

/**
 * Stores a global inside the session locals dict.
 */
export const copyVariableToSessionLocals = (executeCode: CodeExecutor, sessionId: string, varName: string) =>
    executeCode(`__DW_SCOPE__["${sessionId}"]["locals"]["${varName}"] = ${varName}`);

/**
 * Initializes the wrangling session.
 */
export const initializeSession = (executeCode: CodeExecutor) => {
    // note that `executeCode` returns as a string the STDOUT, so we print the
    // generated session ID at the end of this call
    return executeCode(`
${sessionsPythonCode}
${dataframePythonCode}
${dependenciesPythonCode}

__DW_SESSION_ID__ = __DW_SESSIONS__["create_session"]()

try:
    __DW_SCOPE__[__DW_SESSION_ID__] = {"locals": {}}
except NameError:
    __DW_SCOPE__ = {__DW_SESSION_ID__: {"locals": {}}}
 
def __DW_DISPOSE_SCOPE__(session_id):
    if session_id in __DW_SCOPE__:
        del __DW_SCOPE__[session_id]

__DW_SCOPE__["dispose"] = __DW_DISPOSE_SCOPE__
__DW_SCOPE__[__DW_SESSION_ID__]["sessions"] = __DW_SESSIONS__
__DW_SCOPE__[__DW_SESSION_ID__]["dependencies"] = __DW_DEPENDENCIES__
__DW_SCOPE__[__DW_SESSION_ID__]["dataframe"] = __DW_DATAFRAME__(__DW_SCOPE__[__DW_SESSION_ID__])

del __DW_SESSIONS__
del __DW_DATAFRAME__
del __DW_DEPENDENCIES__
del __DW_DISPOSE_SCOPE__

def __DW_INIT__():
    import json
    is_conda_env = __DW_SCOPE__[__DW_SESSION_ID__]["dependencies"]["is_conda_env"]()
    is_pyodide_env = __DW_SCOPE__[__DW_SESSION_ID__]["dependencies"]["is_pyodide_env"]()
    print(json.dumps({"id": __DW_SESSION_ID__, "isCondaEnv": is_conda_env, "isPyodideEnv": is_pyodide_env}))

__DW_INIT__()
del __DW_INIT__
del __DW_SESSION_ID__`).then((result) => {
        const parsed = JSON.parse(result);
        return {
            sessionId: parsed.id,
            isCondaEnv: parsed.isCondaEnv,
            isPyodideEnv: parsed.isPyodideEnv
        };
    });
};

/**
 * Removed the current session from scope.
 */
export const disposeSession = (executeCode: CodeExecutor, sessionId: string) =>
    executeCode(`__DW_SCOPE__["dispose"]("${sessionId}")`);

/**
 * Deletes the given variable from the session locals.
 */
export const deleteVariable = (executeCode: CodeExecutor, sessionId: string, varName: string) =>
    executeCode(`${getRemovePreviewItemCode(sessionId, varName)}\n${getDeleteLocalVariableCode(sessionId, varName)}`);

const getSessionCode = (sessionId: string) => {
    return `__DW_SCOPE__["${sessionId}"]`;
};

const getSessionsModuleCode = (sessionId: string) => {
    return `${getSessionCode(sessionId)}["sessions"]`;
};

const getDependenciesModuleCode = (sessionId: string) => {
    return `${getSessionCode(sessionId)}["dependencies"]`;
};

const getDataframeModuleCode = (sessionId: string) => {
    return `${getSessionCode(sessionId)}["dataframe"]`;
};

export const getScopedVariable = (sessionId: string, varName: string, optional: boolean = false) => {
    if (optional) {
        return `${getSessionCode(sessionId)}["locals"].get("${varName}")`;
    }
    return `${getSessionCode(sessionId)}["locals"]["${varName}"]`;
};

const convertToPythonExpr = (data: any): string => {
    function esc(str: string) {
        return str.replace(/"/g, "\\");
    }

    switch (typeof data) {
        case "object":
            if (Array.isArray(data)) {
                return `[${data.map(convertToPythonExpr).join(", ")}]`;
            }
            return data
                ? `{${Object.keys(data)
                      .map((k) => {
                          return `"${esc(k)}": ${convertToPythonExpr(data[k])}`;
                      })
                      .join(",")}}`
                : "None";
        case "string":
            return `"${esc(data)}"`;
        case "number":
            return String(data); // Assumes the number is finite
        case "boolean":
            return data ? "True" : "False";
        case "undefined":
        default:
            return "None";
    }
};

/**
 * Gets the installed and missing package dependencies given the target dependencies map.
 */
export const getPackageDependencies = (
    executeCode: CodeExecutor,
    sessionId: string,
    dependenciesMap: IPackageDependencyMap
): AsyncTask<IResolvedPackageDependencyMap> =>
    executeCode(
        `${getDependenciesModuleCode(sessionId)}["get_dependencies"](${convertToPythonExpr(dependenciesMap)})`
    ).then(JSON.parse);

/**
 * Returns true if pip installer is available.
 */
export const isPipAvailable = (executeCode: CodeExecutor, sessionId: string) =>
    executeCode(`print(${getDependenciesModuleCode(sessionId)}["is_pip_available"]())`).then(
        (res) => res.trim() === "True"
    );

/**
 * Ensures that pip is installed.
 */
export const ensurePip = (executeCode: CodeExecutor, sessionId: string, options?: ICodeExecutorOptions) =>
    executeCode(`${getDependenciesModuleCode(sessionId)}["ensure_pip"]()`, options);

/**
 * Installs the given dependency.
 */
export const installDependency = (
    executeCode: CodeExecutor,
    sessionId: string,
    dependency: string,
    installer: PythonPackageInstallers,
    options?: ICodeExecutorOptions
) => {
    return executeCode(
        `${getDependenciesModuleCode(sessionId)}["install_dependency"]('${dependency}', '${installer}')`,
        options
    );
};

/**
 * Gets the dataframe info for the given dataframe variable.
 */
export const getDataFrameInfo = (
    executeCode: CodeExecutor,
    sessionId: string,
    varName: string,
    previousVarName?: string,
    previewStrategy?: PreviewStrategy
): AsyncTask<IGetDataframeInfoResponse> => {
    const previousVarNameArg = previousVarName ? getScopedVariable(sessionId, previousVarName) : "None";
    return executeCode(
        `print(${getDataframeModuleCode(sessionId)}["get_dataframe_info"](${getScopedVariable(
            sessionId,
            varName
        )}, ${previousVarNameArg}, ${previewStrategy ? `"${previewStrategy}"` : "None"}))`
    ).then(JSON.parse);
};

/**
 * Loads the diff between two dataframes.
 */
export const loadDataFrameDiff = (
    executeCode: CodeExecutor,
    sessionId: string,
    varName: string,
    previousVarName?: string,
    previewStrategy?: PreviewStrategy
): AsyncTask<void> => {
    const previousVarNameArg = previousVarName ? getScopedVariable(sessionId, previousVarName) : "None";
    return executeCode(
        `${getDataframeModuleCode(sessionId)}["create_preview_dataframe"](${getScopedVariable(
            sessionId,
            varName
        )}, ${previousVarNameArg}, ${previewStrategy ? `"${previewStrategy}"` : "None"})`
    ).then(() => undefined);
};

/**
 * Gets the dataframe header statistics for the given dataframe variable.
 */
export const getDataFrameHeaderStats = (
    executeCode: CodeExecutor,
    sessionId: string,
    varName: string,
    isPreview: boolean
): AsyncTask<IGetDataframeHeaderStatsResponse> => {
    const isPreviewBool = isPreview ? "True" : "False";
    return executeCode(
        `print(${getDataframeModuleCode(sessionId)}["get_dataframe_header_stats"](${getScopedVariable(
            sessionId,
            varName
        )}, ${isPreviewBool}))`
    ).then(JSON.parse);
};

/**
 * Gets the dataframe column statistics for the given dataframe variable and column names.
 */
export const getDataFrameColumnStats = (
    executeCode: CodeExecutor,
    sessionId: string,
    varName: string,
    isPreview: boolean,
    columnIndex: number
): AsyncTask<IGetDataframeColumnStatsResponse> => {
    const isPreviewBool = isPreview ? "True" : "False";
    return executeCode(
        `print(${getDataframeModuleCode(sessionId)}["get_dataframe_column_stats"](${getScopedVariable(
            sessionId,
            varName
        )}, ${isPreviewBool}, ${columnIndex}))`,
        { priority: ExecutionPriority.LOW }
    ).then(JSON.parse);
};

/**
 * Gets the dataframe rows for the given dataframe variable.
 */
export const getDataFrameRows = (
    executeCode: CodeExecutor,
    sessionId: string,
    varName: string,
    isPreview: boolean,
    cursor: IGetDataframeRowsCursor | undefined,
    rowLimit: number, // Maximum number of rows to return.
    dataLimit: number // Maximum size of the data to return.
): AsyncTask<IGetDataframeRowsResponse> => {
    const isPreviewBool = isPreview ? "True" : "False";
    const requestedRowIndex = cursor?.rowIndex ?? 0;
    const requestedInlineIndex = cursor?.inlineIndex ?? 0;
    return executeCode(
        `print(${getDataframeModuleCode(sessionId)}["get_dataframe_rows"](${getScopedVariable(
            sessionId,
            varName
        )}, ${isPreviewBool}, ${requestedRowIndex}, ${requestedInlineIndex}, ${rowLimit}, ${dataLimit}), end='')`
    ).then((resText) => {
        // This should match the transit format outlined in dataframe.py
        const match = /^(\d+);(\d+);(\d+);([\s\S]*)$/.exec(resText);
        if (!match) {
            throw new Error("Received unexpected response: " + resText);
        }

        const [, rawRowIndex, rawInlineIndex, rawRowDataLength, data] = match;
        const rowIndex = parseInt(rawRowIndex);
        const inlineIndex = parseInt(rawInlineIndex);
        const rowDataLength = parseInt(rawRowDataLength);
        let partialRow = data.substring(rowDataLength);

        let rawRows: Array<
            [
                data: any[],
                annotations?: {
                    _modified?: string;
                    _type?: PreviewAnnotationType;
                }
            ]
        > = [];
        if (rowDataLength) {
            // Note that `completeRows` only guarantees that the *end* will be "complete".
            // It assumes that any prior partial rows will be prefixed, as done below.
            const completeRows = data.substring(0, rowDataLength);
            rawRows = JSON.parse(`[${cursor?.partialRow ?? ""}${completeRows}]`);
        } else if (cursor && cursor.partialRow) {
            // If there are no complete rows and we already have a partial row, we need to aggregate the partials.
            partialRow = cursor.partialRow + partialRow;
        }

        return {
            rows: rawRows.map((rawRow, idx) => {
                const [data, annotations] = rawRow;
                const row: IDataFrameRow = {
                    data,
                    index: requestedRowIndex + idx
                };
                if (annotations) {
                    const { _modified, _type } = annotations;
                    row.annotations = {
                        annotationType: _type,
                        modifiedColumns: (_modified?.trim() || undefined)
                            ?.split(" ")
                            .map((col: string) => parseInt(col))
                    };
                }
                return row;
            }),
            cursor: {
                rowIndex,
                inlineIndex,
                partialRow
            }
        };
    });
};

/**
 * Clears preview state after rows have been fetched.
 */
export const removePreviewItem = (executeCode: CodeExecutor, sessionId: string, varName: string) =>
    executeCode(getRemovePreviewItemCode(sessionId, varName));

/**
 * Returns the code remove preview items.
 * It's important that we call these whenever we clean up preview data frames otherwise we may end up
 * with a memory leak.
 */
export const getRemovePreviewItemCode = (sessionId: string, varName: string) =>
    `${getDataframeModuleCode(sessionId)}["remove_preview_item"](${getScopedVariable(sessionId, varName, true)})`;

/**
 * Returns the code to delete local variables.
 */
export const getDeleteLocalVariableCode = (sessionId: string, varName: string) =>
    `try:\n  del ${getScopedVariable(sessionId, varName)}\nexcept:\n  pass`;

const computeAndReadStringVariable = AsyncTask.factory(
    "computeAndReadStringVariable",
    async (
        subtask,
        executeCode: CodeExecutor,
        sessionId: string,
        tempVarRef: string,
        initCode: string,
        onBufferRead: (raw: string) => void,
        dataLimit: number
    ) => {
        let offset = 0;
        let dataTransferComplete = false;

        // create the string and store it
        await subtask(executeCode(initCode), "computeVariable");

        try {
            while (!dataTransferComplete) {
                const resText = await subtask(
                    executeCode(
                        `print(${getDataframeModuleCode(
                            sessionId
                        )}["read_string_in_chunks"](${tempVarRef}, ${offset}, ${dataLimit}))`
                    ),
                    "readData"
                );
                const parsed = JSON.parse(resText) as {
                    raw: string;
                    readPosition: number;
                    done: boolean;
                };

                // append to existing buffer
                onBufferRead(parsed.raw);

                // sanity check: make sure we either make progress or error out so as to avoid a permanent loop
                if (parsed.readPosition <= offset) {
                    throw new Error("Failed to read data");
                }

                offset = parsed.readPosition;

                if (parsed.done) {
                    dataTransferComplete = true;
                }
            }
        } catch (e) {
            throw e;
        } finally {
            await subtask(executeCode(`del ${tempVarRef}`), "deleteTempVar");
        }
    }
);

export const getCsv = AsyncTask.factory(
    "getCsv",
    async (subtask, executeCode: CodeExecutor, sessionId: string, varName: string, dataLimit: number) => {
        const textEncoder = new TextEncoder();
        let bytes: Uint8Array | undefined;

        const csvTempVarName = "__DW_CSV";
        const csvTempVarRef = getScopedVariable(sessionId, csvTempVarName);

        await subtask(
            computeAndReadStringVariable(
                executeCode,
                sessionId,
                csvTempVarRef,
                `${csvTempVarRef} = ${getScopedVariable(sessionId, varName)}.to_csv(index=False)`,
                (raw) => {
                    const newBytes = textEncoder.encode(raw);
                    if (!bytes) {
                        bytes = newBytes;
                    } else {
                        const mergedBytes = new Uint8Array(bytes.length + newBytes.length);
                        mergedBytes.set(bytes, 0);
                        mergedBytes.set(newBytes, bytes.byteLength);
                        bytes = mergedBytes;
                    }
                },
                dataLimit
            )
        );

        if (!bytes) {
            throw new Error("No bytes received");
        }

        return bytes;
    }
);

export const getParquet = AsyncTask.factory(
    "getParquet",
    async (subtask, executeCode: CodeExecutor, sessionId: string, varName: string, dataLimit: number) => {
        let base64String = "";
        let bytes: Uint8Array | undefined;

        const parquetTempVarName = "__DW_PARQUET";
        const parquetTempVarRef = getScopedVariable(sessionId, parquetTempVarName);

        await subtask(
            computeAndReadStringVariable(
                executeCode,
                sessionId,
                parquetTempVarRef,
                // create the parquet string and store it. Note that since parquet is binary, we need to base64-encode it in Python so that it becomes just ASCII characters that we can pipe through stdout. We'll decode it on the JS side.
                // The reason we need the `decode('ascii')` part is because Python's `base64.b64encode` returns a `bytes` object, but we need a string in order to print it properly.
                "import base64\n" +
                    `${parquetTempVarRef} = base64.b64encode(${getScopedVariable(
                        sessionId,
                        varName
                    )}.to_parquet(compression='gzip')).decode('ascii')`,
                (raw) => {
                    base64String += raw;
                },
                dataLimit
            )
        );

        bytes = toByteArray(base64String);
        if (!bytes) {
            throw new Error("No bytes received");
        }

        return bytes;
    }
);

/**
 * Returns the path relative to the working directory.
 */
export const getRelativePath = (executeCode: CodeExecutor, sessionId: string, newDirectory: string) =>
    executeCode(`print(${getSessionsModuleCode(sessionId)}["get_relative_path"](r"${newDirectory}"), end='')`);
