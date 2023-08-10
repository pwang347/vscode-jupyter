import { DataImportOperationKey } from "@dw/messaging";
import { escapeSingleQuote } from "../../../../core/operations/util";
import { ReadParquetImportOperationBase } from "../../../../core/operations/dataImport/readParquet";
import { extendBaseDataImportOperation } from "../../../../core/translate";

export default {
    [DataImportOperationKey.ReadParquet]: extendBaseDataImportOperation(ReadParquetImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName, fileUri, relativeFileUri } = ctx.baseProgram;
            const fileUriEscaped = escapeSingleQuote(fileUri);
            const fileUriEscapedForDescription = escapeSingleQuote(relativeFileUri ?? fileUri);
            return {
                getRuntimeCode: () =>
                    ["import pandas as pd", `${variableName} = pd.read_parquet(r'${fileUriEscaped}')`].join("\n"),
                getDisplayCode: () =>
                    [
                        "import pandas as pd",
                        `${variableName} = pd.read_parquet(r'${fileUriEscapedForDescription}')`
                    ].join("\n")
            };
        }
    })
};
