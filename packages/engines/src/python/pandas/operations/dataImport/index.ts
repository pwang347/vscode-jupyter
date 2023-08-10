import { DataImportOperationMap } from "@dw/orchestrator";
import readCsv from "./readCsv";
import readParquet from "./readParquet";
import variable from "./variable";

/**
 * Pandas data import operations.
 */
export const PandasDataImportOperations: DataImportOperationMap = {
    ...readCsv,
    ...readParquet,
    ...variable
};
