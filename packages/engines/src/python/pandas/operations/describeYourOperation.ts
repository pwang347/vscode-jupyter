import { OperationKey } from "@dw/orchestrator";
import { DescribeYourOperationBase } from "../../../core/operations/describeYourOperation";
import { extendBaseOperation } from "../../../core/translate";
import { createWranglingCompletion } from "../naturalLanguage";

export default {
    [OperationKey.DescribeYourOperation]: extendBaseOperation(DescribeYourOperationBase, {
        config: {
            createWranglingCompletion
        },
        translateBaseProgram: (ctx) => {
            const { customCode } = ctx.baseProgram;
            return {
                getCode: () => customCode
            };
        }
    })
};
