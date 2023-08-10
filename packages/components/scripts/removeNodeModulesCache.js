const fs = require("fs");

// Remove the node_modules/.cache folder
// This is needed to force microbundle-crl to recompile the components when the source code changes
console.log("Removing node_modules/.cache folder...");

// Checking if the folder exists before removing it
if (!fs.existsSync("node_modules/.cache/")) {
    console.log("node_modules/.cache/ folder doesn't exist");
} else {
    fs.rmSync("node_modules/.cache/", { recursive: true });
    console.log("Removed folder node_modules/.cache/");
}
