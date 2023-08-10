import { WranglerEngineIdentifier } from "../../../types";
import Operations from "./flashFill";
import { assertOperationCode } from "./testUtil";

const operation = Operations.NewColumnByExample;

describe("[Pandas] Column operation: FlashFill", () => {
    it("should handle happy path for 1 selected column and no examples", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                insertIndex: 1,
                newColumnName: "Some_column_derived"
            },
            {
                code: `df.insert(1, 'Some_column_derived', df.apply(lambda row : "", axis=1))`
            }
        );
    });

    it("should handle happy path for 1 selected column and some examples", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                insertIndex: 1,
                newColumnName: "Some_column_derived",
                derivedCode: {
                    [WranglerEngineIdentifier.Pandas]: "foo",
                    [WranglerEngineIdentifier.PySpark]: "bar"
                }
            },
            {
                code: "foo"
            }
        );
    });
});
