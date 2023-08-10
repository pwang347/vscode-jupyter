import { codeHasFunction, codeHasImport, extractComment } from "../../python/util";
import { CustomOperationBase } from "./customOperation";
import { getZeroColumnOperationContext, assertOperationBaseProgramGenSuccess } from "./testUtil";

const operation = CustomOperationBase({
    extractComment,
    hasImport: codeHasImport,
    hasFunction: codeHasFunction
});

describe("[Base Program] Custom operation", () => {
    it("should handle happy path", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getZeroColumnOperationContext({
                CustomCode: "df = df"
            }),
            {
                variableName: "df",
                customCode: "df = df"
            },
            "Custom operation"
        );
    });

    it("should handle happy path with custom description", async () => {
        await assertOperationBaseProgramGenSuccess(
            operation,
            getZeroColumnOperationContext({
                CustomCode: ["# foo", "df = df"].join("\n")
            }),
            {
                variableName: "df",
                customCode: ["# foo", "df = df"].join("\n")
            },
            "foo"
        );
    });
});
