import { AsyncTask, DataImportOperationKey, ErrorCode, IError } from "@dw/messaging";
import * as assert from "assert";
import { LocalizedStrings, OperationCodeGenResultType } from "..";
import {
    formatString,
    getMockComms,
    getMockEngine,
    getMockNaturalLanguageClient,
    getMockProseApiClient
} from "../test/common";
import { BasicOrchestrator } from "./basicOrchestrator";

describe("Basic orchestrator", () => {
    it("should reject invalid engines", () => {
        const mockComms = getMockComms();
        const mockEngine = getMockEngine({ id: "bar" });
        const badMapping = {
            foo: {
                engine: mockEngine
            }
        };
        assert.throws(
            () => {
                new BasicOrchestrator(
                    mockComms,
                    badMapping,
                    {},
                    (locale: string) => LocalizedStrings.Orchestrator,
                    formatString,
                    "en",
                    getMockProseApiClient(),
                    getMockNaturalLanguageClient()
                );
            },
            Error,
            "Failed sanity check: engine ID mismatch"
        );
    });

    it("should not reject valid engines", () => {
        const mockComms = getMockComms();
        const mockEngine = getMockEngine({ id: "foo" });
        const goodMapping = {
            foo: {
                engine: mockEngine
            }
        };
        assert.doesNotThrow(() => {
            new BasicOrchestrator(
                mockComms,
                goodMapping,
                {},
                (locale: string) => LocalizedStrings.Orchestrator,
                formatString,
                "en",
                getMockProseApiClient(),
                getMockNaturalLanguageClient()
            );
        });
    });

    it("should raise an error if data import operation key is unknown", async () => {
        let raisedError: IError | undefined = undefined;
        const mockComms = getMockComms({
            code: {
                execute: async (code) => {
                    if (code === "throw") {
                        throw new Error("Code failed to execute");
                    }
                    return code;
                },
                interrupt: async () => {}
            },
            ui: {
                raiseError: (error: IError) => {
                    raisedError = error;
                }
            } as any
        });
        const mockEngine = getMockEngine({ id: "foo" });
        const goodMapping = {
            foo: {
                engine: mockEngine
            }
        };
        const orchestrator = new BasicOrchestrator(
            mockComms,
            goodMapping,
            {},
            (locale: string) => LocalizedStrings.Orchestrator,
            formatString,
            "en",
            getMockProseApiClient(),
            getMockNaturalLanguageClient()
        );
        await orchestrator.startWranglerSession(mockEngine.id, "InvalidOperationKey" as any, (context) => {
            return AsyncTask.resolve({
                result: OperationCodeGenResultType.Success,
                getRuntimeCode: () => {
                    return "throw";
                },
                getDisplayCode: () => {
                    return "throw";
                },
                getDescription: () => {
                    return "description";
                }
            });
        });
        const expectedError: IError<ErrorCode.DataLoadFailedError> = {
            code: ErrorCode.DataLoadFailedError,
            value: {
                innerError: "Error: Code failed to execute"
            }
        };

        if (raisedError === undefined) {
            assert.fail("Did not receive an error");
        }

        const raisedErrorTyped = raisedError as IError<ErrorCode.DataLoadFailedError>;
        assert.equal(raisedErrorTyped.code, expectedError.code);
        assert.equal(
            raisedErrorTyped.value.innerError,
            "Could not find operation 'InvalidOperationKey' for engine 'foo'"
        );
    });
});
