import { typeEqual } from "./util";
import * as assert from "assert";

describe("util helpers tests", () => {
    describe("typeEqual tests", () => {
        it("Tests for type equality between objects", () => {
            // equal
            assert.equal(typeEqual({ arg1: 100 }, { arg1: 0 }), true);
            assert.equal(typeEqual({ arg1: 100.5 }, { arg1: 0 }), true);
            assert.equal(typeEqual({ arg1: "strval1" }, { arg1: "strval2" }), true);
            assert.equal(typeEqual({ arg1: "" }, { arg1: "strval2" }), true);
            assert.equal(typeEqual({ arg1: "" }, { arg1: "" }), true);
            assert.equal(typeEqual({ arg1: null }, { arg1: null }), true);
            assert.equal(typeEqual({ arg1: 100, arg2: "strval1" }, { arg1: 0, arg2: "strval2" }), true);

            // not equal
            assert.equal(typeEqual({ arg1: 50 }, { arg2: 50 }), false);
            assert.equal(typeEqual({ arg1: "" }, { arg1: 50 }), false);
            assert.equal(typeEqual({ arg1: "strval1" }, { arg2: "strval2" }), false);
            assert.equal(typeEqual({ arg1: null }, { arg2: "strval2" }), false);
            assert.equal(typeEqual({ arg1: null }, { arg1: 50 }), false);
            assert.equal(typeEqual({ arg1: "" }, { arg1: null }), false);
            assert.equal(typeEqual({ arg1: 100, arg2: "strval1" }, { arg1: 0, arg3: "strval2" }), false);
            assert.equal(
                typeEqual({ arg1: 100, arg2: "strval1" }, { arg1: 0, arg2: "strval2", arg3: "strval3" }),
                false
            );
        });
    });
});
