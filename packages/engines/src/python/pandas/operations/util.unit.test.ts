import * as assert from "assert";
import { redactRawType } from "./util";

describe("Operation util tests", () => {
    describe("redactRawType", () => {
        it("should not redact known types", () => {
            assert.strictEqual(redactRawType("string"), "string");
            assert.strictEqual(redactRawType("datetime64[ns, Europe/Berlin]"), "datetime64[ns, Europe/Berlin]");
            assert.strictEqual(redactRawType("Float64"), "Float64");
            assert.strictEqual(redactRawType("complex64"), "complex64");
            assert.strictEqual(redactRawType("Sparse[float64, nan]"), "Sparse[float64, nan]");
            assert.strictEqual(redactRawType("interval[float64, right]"), "interval[float64, right]");
        });

        it("should redact custom types", () => {
            assert.strictEqual(redactRawType("foo"), "[redacted]");
            assert.strictEqual(redactRawType("integer"), "[redacted]");
            assert.strictEqual(redactRawType("int"), "[redacted]");
        });
    });
});
