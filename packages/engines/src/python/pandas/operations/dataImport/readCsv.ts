import { DataImportOperationKey } from "@dw/messaging";
import { escapeSingleQuote } from "../../../../core/operations/util";
import { ReadCsvImportOperationBase } from "../../../../core/operations/dataImport/readCsv";
import { extendBaseDataImportOperation } from "../../../../core/translate";

export default {
    [DataImportOperationKey.ReadCsv]: extendBaseDataImportOperation(ReadCsvImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, fileUri, relativeFileUri, truncationsRows, useArrowEngine } = ctx.baseProgram;
            const fileUriEscaped = escapeSingleQuote(fileUri);
            const fileUriEscapedForDescription = escapeSingleQuote(relativeFileUri ?? fileUri);
            if (truncationsRows && !useArrowEngine) {
                return {
                    getRuntimeCode: () =>
                        [
                            `import pandas as pd`,
                            // We load one more row than needed so that we can tell if the data was truncated.
                            // This is fine since we only truncate the top rows, but if we ever support other sampling methods on load
                            // We will need another way to tell if truncation happened without affecting the result.
                            `${df} = pd.read_csv(r'${fileUriEscaped}', nrows=${truncationsRows! + 1})`,
                            // If the data is larger than the truncation limit, output to indicate as much and then truncate it.
                            `if len(${df}) > ${truncationsRows!}:`,
                            `    print('{"truncated": true}')`,
                            `    ${df} = ${df}.head(${truncationsRows!})`
                        ].join("\n"),
                    getDisplayCode: () =>
                        ["import pandas as pd", `${df} = pd.read_csv(r'${fileUriEscapedForDescription}')`].join("\n")
                };
            }
            const readEngine = useArrowEngine ? ", engine='pyarrow'" : "";
            return {
                getRuntimeCode: () =>
                    ["import pandas as pd", `${df} = pd.read_csv(r'${fileUriEscaped}'${readEngine})`].join("\n"),
                getDisplayCode: () =>
                    [
                        "import pandas as pd",
                        `${df} = pd.read_csv(r'${fileUriEscapedForDescription}'${readEngine})`
                    ].join("\n")
            };
        }
    })
};
