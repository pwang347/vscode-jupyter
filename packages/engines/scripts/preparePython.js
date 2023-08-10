/**
 * This script is needed to make sure that we can consume .py files as strings in TS.
 * Before we build, we precompile the .py files into .python.ts files.
 */

const fs = require("fs");

function getFiles(dir) {
    return fs.readdirSync(dir).flatMap((item) => {
        const path = `${dir}/${item}`;
        if (fs.statSync(path).isDirectory()) {
            return getFiles(path);
        }

        return path;
    });
}

const files = getFiles("src/python");
if (files.length === 0) {
    throw new Error("Couldn't find any python files to build. Is the above path still accurate?");
}

for (const file of files) {
    if (file.endsWith(".py") && !file.endsWith("_test.py") && !file.endsWith("__init__.py")) {
        const content = fs.readFileSync(file).toString();
        // use JSON.stringify to escape the string properly
        const tsContent = `const content = ${JSON.stringify(content)}\nexport default content;`;
        fs.writeFileSync(file.replace(".py", ".python.ts"), tsContent);
    }
}
