import Operations from "./describeYourOperation";
import { assertOperationCode } from "./testUtil";

const operation = Operations.DescribeYourOperation;

describe("[Pandas] Describe your operation", () => {
    it("should handle happy path", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                customCode: "df = df"
            },
            {
                code: "df = df"
            }
        );
    });
});
