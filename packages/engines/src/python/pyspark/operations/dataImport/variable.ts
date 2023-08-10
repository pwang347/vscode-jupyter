import { VariableImportOperationBase } from "../../../../core/operations/dataImport/variable";
import { extendBaseDataImportOperation } from "../../../../core/translate";
import { DataImportOperationKey } from "@dw/messaging";

export default {
    [DataImportOperationKey.Variable]: extendBaseDataImportOperation(VariableImportOperationBase, {
        translateBaseProgram: (ctx) => {
            const { variableName: df, truncationRows } = ctx.baseProgram;
            // TODO@DW: handle unsupported arguments
            return {
                getRuntimeCode: () =>
                    truncationRows
                        ? [
                              `if len(${df}) > ${truncationRows}:`,
                              `    ${df} = ${df}.head(${truncationRows})`,
                              `    print('{"truncated": true}')`
                          ].join("\n")
                        : "",
                getDisplayCode: () => ""
            };
        }
    })
};
