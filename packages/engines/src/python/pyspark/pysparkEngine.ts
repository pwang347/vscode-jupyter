import { IWranglerTranslationEngine, WranglerCodeExportFormat } from "@dw/orchestrator";
import { WranglerEngineIdentifier } from "../../types";
import { PySparkOperations } from "./operations";
import { AsyncTask, ColumnType, IHistoryItem } from "@dw/messaging";
import { buildCleaningCode, getCleanedVarName } from "../codeExportHelpers";
import { PySparkDataImportOperations } from "./operations/dataImport";
import { toPythonValueString } from "../util";

/**
 * A data wrangler engine for PySpark.
 */
export class PySparkEngine implements IWranglerTranslationEngine {
    public readonly id = WranglerEngineIdentifier.PySpark;

    /** The display name of the engine */
    public getName = () => "PySpark";

    public readonly operations = PySparkOperations;
    public readonly dataImportOperations = PySparkDataImportOperations;
    public readonly lineCommentPrefix = "# ";

    public readonly codeExporters = {
        [WranglerCodeExportFormat.Function]: this.exportCodeAsFunction.bind(this)
    };

    constructor(private useDisplayMethodForCodeExport: boolean = false) {}

    private exportCodeAsFunction(variableToWrangle: string, historyItems: IHistoryItem[], preCode?: string) {
        if (historyItems.length === 0) {
            return AsyncTask.resolve("");
        }
        const cleanedVarName = getCleanedVarName(variableToWrangle);
        return AsyncTask.resolve(
            `${preCode ?? ""}${buildCleaningCode(
                variableToWrangle,
                this.lineCommentPrefix,
                cleanedVarName,
                historyItems,
                false
            )}${this.useDisplayMethodForCodeExport ? `\ndisplay(${cleanedVarName})` : `\n${cleanedVarName}.show()`}`
        );
    }

    /**
     * Redacts custom raw types.
     */
    public redactCustomRawType(rawType: string) {
        // PySpark doesn't support custom types so nothing to redact here
        return rawType;
    }

    /**
     * Stringifies a value.
     */
    public stringifyValue(value: any, type?: ColumnType) {
        const pythonValue = toPythonValueString(value, type);
        return pythonValue.displayValue ?? pythonValue.value;
    }
}
