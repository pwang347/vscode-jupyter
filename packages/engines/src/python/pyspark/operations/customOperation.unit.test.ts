import Operations from "./customOperation";
import { assertOperationCode } from "./testUtil";

const operation = Operations.CustomOperation;

describe("[PySpark] Custom operation", () => {
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
