import os
import pandas as pd
from collections import namedtuple

output_path = "%s/test_dataframes" % (os.path.dirname(__file__))
if not os.path.exists(output_path):
    os.makedirs(output_path)

RunConfig = namedtuple("RunConfig", ["rows", "columns", "cell_size"])
rows_matrix = [5000, 50_000, 100_000]
cols_matrix = [80, 250, 500, 1000, 1500]
cell_size_matrix = [10]

configs = []

for row in rows_matrix:
    for cols in cols_matrix:
        for cell_size in cell_size_matrix:
            configs.append(RunConfig(rows=row, columns=cols, cell_size=cell_size))

for idx, config in enumerate(configs):
    df = pd.DataFrame(
        {
            "col%s" % key: ["*" * config.cell_size for _ in range(config.rows)]
            for key in range(config.columns)
        }
    )
    file_name = "df_%sx%s_%s.parquet" % (config.rows, config.columns, config.cell_size)
    df.to_parquet(
        os.path.join(
            output_path,
            file_name,
        )
    )
    print("%s/%s - wrote %s" % (idx + 1, len(configs), file_name))
