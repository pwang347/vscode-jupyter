import { ArgType } from "@dw/messaging";
import { addUniqueKeyToArgs } from "./utils";

describe("Operation rendering utilities", () => {
    describe("addUniqueKeyToArgs", () => {
        it("should add unique keys recursively", () => {
            const result = addUniqueKeyToArgs(
                {
                    children: [
                        {
                            [ArgType.Target]: {
                                value: [],
                                children: [
                                    {
                                        [ArgType.Target]: {
                                            value: [],
                                            children: [
                                                {
                                                    [ArgType.Target]: {
                                                        value: []
                                                    }
                                                },
                                                {
                                                    [ArgType.Target]: {
                                                        value: []
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        [ArgType.Target]: {
                                            value: [],
                                            children: [
                                                {
                                                    [ArgType.Target]: {
                                                        value: []
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            [ArgType.Target]: {
                                value: [],
                                children: [
                                    {
                                        [ArgType.Target]: {
                                            value: [],
                                            children: [
                                                {
                                                    [ArgType.Target]: {
                                                        value: []
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
                "test"
            );

            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[0][ArgType.Target].key
            ).toBeDefined();
            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[0][
                    ArgType.Target
                ].key.startsWith("test-")
            );
            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[1][ArgType.Target].key
            ).toBeDefined();
            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[1][
                    ArgType.Target
                ].key.startsWith("test-")
            );
            expect(
                result.children[0][ArgType.Target].children[1][ArgType.Target].children[0][ArgType.Target].key
            ).toBeDefined();
            expect(
                result.children[0][ArgType.Target].children[1][ArgType.Target].children[0][
                    ArgType.Target
                ].key.startsWith("test-")
            );
            expect(
                result.children[1][ArgType.Target].children[0][ArgType.Target].children[0][ArgType.Target].key
            ).toBeDefined();
            expect(
                result.children[1][ArgType.Target].children[0][ArgType.Target].children[0][
                    ArgType.Target
                ].key.startsWith("test-")
            );
        });

        it("should not add keys to args that already have them", () => {
            const result = addUniqueKeyToArgs(
                {
                    children: [
                        {
                            [ArgType.Target]: {
                                value: [],
                                children: [
                                    {
                                        [ArgType.Target]: {
                                            value: [],
                                            children: [
                                                {
                                                    [ArgType.Target]: {
                                                        value: [],
                                                        key: "test-key"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                },
                "test"
            );

            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[0][ArgType.Target].key
            ).toEqual("test-key");
        });

        it("should not crash when children aren't objects", () => {
            const result = addUniqueKeyToArgs(
                {
                    children: [
                        {
                            [ArgType.Target]: {
                                value: [],
                                children: [
                                    {
                                        [ArgType.Target]: {
                                            value: [],
                                            children: [
                                                {
                                                    [ArgType.Target]: "some string"
                                                },
                                                {
                                                    [ArgType.Target]: {
                                                        value: []
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        [ArgType.Target]: "some string 2"
                                    }
                                ]
                            }
                        },
                        {
                            [ArgType.Target]: "some string 3"
                        }
                    ]
                },
                "test"
            );

            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[1][ArgType.Target].key
            ).toBeDefined();
            expect(
                result.children[0][ArgType.Target].children[0][ArgType.Target].children[1][
                    ArgType.Target
                ].key.startsWith("test-")
            );
        });
    });
});
