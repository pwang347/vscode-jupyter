import { OperationKey } from "@dw/orchestrator";
import { DescribeYourOperationBase } from "../../../core/operations/describeYourOperation";
import { extendBaseOperation } from "../../../core/translate";

export default {
    [OperationKey.DescribeYourOperation]: extendBaseOperation(DescribeYourOperationBase, {
        config: {
            createWranglingCompletion: async (client, _variableName, _dataFrame, prompt) => {
                // TODO@DW: add support for pyspark prompt engineering
                return client.createCompletion(prompt);
            }
        },
        translateBaseProgram: (ctx) => {
            const { customCode } = ctx.baseProgram;
            return {
                getCode: () => customCode
            };
        }
    })
};
