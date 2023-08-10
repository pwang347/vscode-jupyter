import * as assert from "assert";
import { getCleanedVarName } from "./codeExportHelpers";

describe("Code export helpers", () => {
    it("properly creates the clean variable name with a counter", async () => {
        assert.equal(getCleanedVarName("df"), "df_clean");
        assert.equal(getCleanedVarName("df_clean"), "df_clean_1");
        assert.equal(getCleanedVarName("df_clean_1"), "df_clean_2");
        assert.equal(getCleanedVarName("df_clean_10"), "df_clean_11");
        assert.equal(getCleanedVarName("df_clean_100"), "df_clean_101");
    });
});
