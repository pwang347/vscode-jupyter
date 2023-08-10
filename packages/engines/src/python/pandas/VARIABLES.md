# Variables

The goal of this document is to keep track of the variables we use and to make sure that we aren't creating any memory leaks.

Note that this document does not include exported variables, but only those that may exist on the kernel during a Data Wrangler session.

## Guidance to avoid memory leaks

When making changes to the engine, please fill in the following details related to the variables introduced. By doing this, we will have a better way to track whether changes will cause memory leaks.

## Global variables (user-scope)

| Var name / pattern | Description                                                  | Created when                  | Deleted when                                                  |
| ------------------ | ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `__DW_SCOPE__`     | Global dictionary object storing all Data Wrangler sessions. | A new session is launched.    | Deleted when exiting a session and no sessions are remaining. |
| `__DW_BATCH__`     | Temporary function used during code batching.                | A new request to batch calls. | Immediately after the batch is executed (even if errored).    |

Other temporary global variables used during init that are immediately cleaned up:

-   `__DW_SESSIONS__`
-   `__DW_DATAFRAME__`
-   `__DW_DEPENDENCIES__`
-   `__DW_DISPOSE_SCOPE__`
-   `__DW_INIT__`
-   `__DW_SESSION_ID__`

## Session modules (under `__DW_SCOPE__`)

| Var name / pattern | Description                             | Created when               | Deleted when        |
| ------------------ | --------------------------------------- | -------------------------- | ------------------- |
| `dataframe`        | Functions defined in `dataframe.py`.    | A new session is launched. | Session is deleted. |
| `dependencies`     | Functions defined in `dependencies.py`. | A new session is launched. | Session is deleted. |
| `sessions`         | Functions defined in `sessions.py`.     | A new session is launched. | Session is deleted. |
| `locals`           | Container for local variables.          | A new session is launched. | Session is deleted. |

## Module persistent variables (under `__DW_SCOPE__[<module>]`)

| Var name / pattern    | Description                                                | Created when                        | Deleted when                                           |
| --------------------- | ---------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `preview_dataframes`  | Dictionary of df -> preview version of it.                 | Summary info is generated for a df. | When a df is deleted or we are replacing the variable. |
| `preview_annotations` | Dictionary of df -> annotations for preview version of it. | Summary info is generated for a df. | When a df is deleted or we are replacing the variable. |

## Session local variables (under `__DW_SCOPE__['locals']`)

| Var name / pattern | Description                                                          | Created when                     | Deleted when                                             |
| ------------------ | -------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| `_<number>`        | Export temp variables.                                               | Evaluating history for export.   | Immediately after (even if errored).                     |
| `df`               | Wrangling variable. May be different depending on the import method. | Operation previewed.             | Operation committed or rejected.                         |
| `_DW_<number>`     | History item variables.                                              | Operation committed.             | Another operation replaces it or an operation is undone. |
| `__DW_CSV`         | Temporary variable used in CSV exports.                              | A new request to export CSV.     | Immediately after CSV export (even if errored).          |
| `__DW_PARQUET`     | Temporary variable used in Parquet exports.                          | A new request to export Parquet. | Immediately after Parquet export (even if errored).      |
