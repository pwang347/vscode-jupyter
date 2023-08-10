import { OperationKey } from "@dw/orchestrator";
import { CustomOperationBase } from "../../../core/operations/customOperation";
import { extendBaseOperation } from "../../../core/translate";
import { codeHasFunction, codeHasImport, extractComment } from "../../util";

export default {
    [OperationKey.CustomOperation]: extendBaseOperation(CustomOperationBase, {
        config: {
            extractComment,
            hasImport: codeHasImport,
            hasFunction: codeHasFunction
        },
        translateBaseProgram: (ctx) => {
            const { customCode } = ctx.baseProgram;
            return {
                getCode: () => customCode
            };
        }
    })
};
