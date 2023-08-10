import Operations from "./scale";
import { assertOperationCode } from "./testUtil";

const operation = Operations.Scale;

describe("[PySpark] Column operation: Scale column", () => {
    it("should handle happy path for 1 selected column", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "from pyspark.ml.feature import MinMaxScaler",
                    "from pyspark.ml.linalg import VectorAssembler",
                    "",
                    "columns_to_scale = ['Some_column']",
                    "assemblers = [VectorAssembler(inputCols=[col], outputCol=col + '_vec') for col in columns_to_scale]",
                    "scalers = [MinMaxScaler(min=0, max=1, inputCol=col + '_vec', outputCol=col + '_scaled') for col in columns_to_scale]",
                    "pipeline = Pipeline(stages=assemblers + scalers)",
                    "scalerModel = pipeline.fit(df)",
                    "df = scalerModel.transform(df)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 1 selected column with single quote in the column names", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'\\'Some_column\\''"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "from pyspark.ml.feature import MinMaxScaler",
                    "from pyspark.ml.linalg import VectorAssembler",
                    "",
                    "columns_to_scale = ['\\'Some_column\\'']",
                    "assemblers = [VectorAssembler(inputCols=[col], outputCol=col + '_vec') for col in columns_to_scale]",
                    "scalers = [MinMaxScaler(min=0, max=1, inputCol=col + '_vec', outputCol=col + '_scaled') for col in columns_to_scale]",
                    "pipeline = Pipeline(stages=assemblers + scalers)",
                    "scalerModel = pipeline.fit(df)",
                    "df = scalerModel.transform(df)"
                ].join("\n")
            }
        );
    });

    it("should handle happy path for 2 selected columns", async () => {
        await assertOperationCode(
            operation,
            {
                variableName: "df",
                columnKeys: ["'Some_column'", "'Another_column'"],
                newMinimum: 0,
                newMaximum: 1
            },
            {
                code: [
                    "from pyspark.ml.feature import MinMaxScaler",
                    "from pyspark.ml.linalg import VectorAssembler",
                    "",
                    "columns_to_scale = ['Some_column', 'Another_column']",
                    "assemblers = [VectorAssembler(inputCols=[col], outputCol=col + '_vec') for col in columns_to_scale]",
                    "scalers = [MinMaxScaler(min=0, max=1, inputCol=col + '_vec', outputCol=col + '_scaled') for col in columns_to_scale]",
                    "pipeline = Pipeline(stages=assemblers + scalers)",
                    "scalerModel = pipeline.fit(df)",
                    "df = scalerModel.transform(df)"
                ].join("\n")
            }
        );
    });
});
