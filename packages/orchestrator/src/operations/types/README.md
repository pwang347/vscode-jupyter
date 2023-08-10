## Data Wrangler Operations Taxonomy

The purpose of this file is to provide some clarity regarding the classification of operations, which may shed some light as to how the interfaces in this types folder are structured.

### Operations vs. Data Import Operations vs. Common Operations

Firstly, we have `Operations` and `Data Import Operations`. `Operations` refer to generic operations that occur once data has been loaded into Data Wrangler (e.g. Fill missing values), whereas `Data Import Operations` refer specifically to data ingestion operations (e.g. Read variable from CSV).

For types specific to `Operations`, we define it in `operations.ts`.
For type specific to `Data Import Operations`, we define it in `dataImportOperations.ts`.
We define shared types used in code generation and more in the `common.ts` file in this folder.

### Base Programs and Code Translation

What are `Base programs`? When generating code, an operation typically consumes the current application context which includes state such as the data in the grid, the user parameters, active kernel dependencies and so forth. The result is a set of generators - generators for the description of the operation performed, telemetry etc, as well as of course code.

To enable code translation, we introduce a concept of `Base programs` which is essentially an abstract object that represents the parameters of the code to be generated without being tied to a particular language or framework. In the `baseProgram.ts` file we define extended variants of `Operations` and `Data Import Operations` which allows us to split up the default code generation process into two phases: 1. Given context, return the full set of generators except instead of the code generator, return a `Base program` generator and 2. Given a `Base program`, return code.
