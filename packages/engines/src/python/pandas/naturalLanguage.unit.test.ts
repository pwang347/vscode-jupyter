import { IDataFrame } from "@dw/messaging";
import { INaturalLanguageClient } from "@dw/orchestrator";
import * as assert from "assert";
import { cleanupCompletion, addContext } from "./naturalLanguage";

describe("Cleanup the generated code", () => {
    it("should remove import pandas", async () => {
        const code = `import pandas as pd
df = df.drop(columns=["Foo"])`;
        assert.strictEqual(cleanupCompletion("df", code), 'df = df.drop(columns=["Foo"])');
    });

    it("should remove import re if it is not used", async () => {
        const code = `import re
df = df.drop(columns=["Foo"])`;
        assert.strictEqual(cleanupCompletion("df", code), 'df = df.drop(columns=["Foo"])');
    });

    it("should NOT remove import re if it is used", async () => {
        const code = `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))`;
        assert.strictEqual(
            cleanupCompletion("df", code),
            `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))`
        );
    });

    it("should remove only unused imports", async () => {
        const code = `import re
                import numpy as np
                import math

df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))`;
        assert.strictEqual(
            cleanupCompletion("df", code),
            `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))`
        );
    });

    it("should remove print lines", async () => {
        const code = `import re
print("Hello world")

df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))

print("""
This is a multi-line print statement
""")

df`;
        assert.strictEqual(
            cleanupCompletion("df", code),
            `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))
df`
        );
    });

    it("should remove df.head() lines", async () => {
        const code = `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))
df = df.head()
df.head(5)
df.head()`;
        assert.strictEqual(
            cleanupCompletion("df", code),
            `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))
df = df.head()`
        );
    });

    it(`should remove entire lines when they contain "pd.read_csv" at any point in the line`, async () => {
        const code = `df = pd.read_csv("foo.csv")
df = df.drop(columns=["Foo"])`;
        assert.strictEqual(cleanupCompletion("df", code), 'df = df.drop(columns=["Foo"])');
    });

    it(`should remove empty lines, trailing and leading whitespace and newlines`, async () => {
        const code = `
import re

df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))

`;
        assert.strictEqual(
            cleanupCompletion("df", code),
            `import re
df['Name'] = df['Name'].apply(lambda x: re.sub(r'\w+\.', '', x))`
        );
    });
});

describe("Add context", () => {
    const getMockNaturalLanguageClient = (maxTokens = 2000) =>
        ({
            getParams: () => ({
                maxTokens,
                includeColumnContext: true,
                includeDataContext: true
            })
        } as INaturalLanguageClient);
    const mockDataFrame = {
        columns: [
            {
                name: "Foo",
                rawType: "object",
                index: 0
            },
            {
                name: "Bar",
                rawType: "int64",
                index: 1
            }
        ],
        getLoadedRows: () => [
            {
                data: ["foo", 1],
                index: 0
            },
            {
                data: ["bar", 2],
                index: 1
            },
            {
                data: ["baz", 3],
                index: 2
            },
            {
                data: ["qux", 4],
                index: 3
            }
        ]
    } as IDataFrame;

    it("should include all context by default", () => {
        const promptContext = addContext(getMockNaturalLanguageClient(), mockDataFrame, "PROMPT");
        assert.strictEqual(
            promptContext,
            `\nThe data types of the columns:

Foo: object
Bar: int64

Here are sample rows for the dataframe:

["foo",1]
["bar",2]
["baz",3]\n\n`
        );
    });

    it("should omit rows if not enough space", () => {
        const promptContext = addContext(getMockNaturalLanguageClient(120), mockDataFrame, "PROMPT");
        assert.strictEqual(
            promptContext,
            `\nThe data types of the columns:

Foo: object
Bar: int64

Here are sample rows for the dataframe:

["foo",1]\n\n`
        );
    });

    it("should include relevant columns only if no rows can fit", () => {
        const promptContext = addContext(
            getMockNaturalLanguageClient(120),
            {
                ...mockDataFrame,
                getLoadedRows: () => [
                    {
                        data: ["foo - this is some very long data".repeat(100), 1],
                        index: 0
                    },
                    {
                        data: ["bar", 2],
                        index: 1
                    },
                    {
                        data: ["baz", 3],
                        index: 2
                    },
                    {
                        data: ["qux", 4],
                        index: 3
                    }
                ]
            },
            "bar"
        );
        assert.strictEqual(
            promptContext,
            `\nHere are sample column types for the dataframe:

Bar: int64

Here are sample rows for the dataframe:
[1]
[2]
[3]\n\n`
        );
    });

    it("should return nothing if there's no space to include context", () => {
        const promptContext = addContext(
            getMockNaturalLanguageClient(),
            mockDataFrame,
            "This is a very long prompt".repeat(100)
        );
        assert.strictEqual(promptContext, "");
    });
});
