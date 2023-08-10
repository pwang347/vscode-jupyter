import { DataImportOperationMap } from "@dw/orchestrator";
import ReadCsv from "./readCsv";
import ReadParquet from "./readParquet";
import Variable from "./variable";

/**
 * PySpark data import operations.
 */
export const PySparkDataImportOperations: DataImportOperationMap = {
    ...ReadCsv,
    ...ReadParquet,
    ...Variable
};
