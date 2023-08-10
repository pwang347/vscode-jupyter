import { WranglerEngineIdentifier } from "../../../types";
import Operations from "./flashFill";
import { assertOperationCode } from "./testUtil";

const operation = Operations.NewColumnByExample;

describe("[PySpark] Column operation: FlashFill", () => {
    it("should handle happy path for 1 selected column and no examples", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                insertIndex: 1,
                newColumnName: "Some_column_derived"
            },
            {
                code: [
                    "from pyspark.sql import types as T",
                    "from pyspark.sql import functions as F",
                    "df = df.withColumn('Some_column_derived', F.lit(None).cast(T.StringType()))",
                    "df = df.select(*(df.columns[:1] + 'Some_column_derived' + df.columns[1:]))"
                ].join("\n")
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
                code: "bar"
            }
        );
    });
});
