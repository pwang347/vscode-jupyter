import unittest
import pandas as pd
import numpy as np
import dataframe
import dependencies
import json
import os

dirname = os.path.dirname(__file__)
session = {"locals": {}, "dependencies": dependencies.__DW_DEPENDENCIES__}
__dw_dataframe = dataframe.__DW_DATAFRAME__(session)
get_dataframe_info = __dw_dataframe["get_dataframe_info"]
get_dataframe_header_stats = __dw_dataframe["get_dataframe_header_stats"]
get_dataframe_column_stats = __dw_dataframe["get_dataframe_column_stats"]
create_preview_dataframe = __dw_dataframe["create_preview_dataframe"]
get_dataframe_rows = __dw_dataframe["get_dataframe_rows"]
remove_preview_item = __dw_dataframe["remove_preview_item"]


def save_df_csv(df, path):
    with open(path, "w", encoding="utf-8") as outfile:
        outfile.write("\n".join(df.to_csv().split("\r\n")))


def save_json(d, path):
    with open(path, "w", encoding="utf-8") as outfile:
        outfile.write(json.dumps(d, indent=4) + "\n")


class TestDataFrameHelpers(unittest.TestCase):
    maxDiff = None

    def assertDataFrameSummaryEqual(
        self,
        df,
        df_header_path,
        df_old=None,
        preview_strategy=None,
        generate_tests=False,
    ):
        header = json.loads(get_dataframe_info(df, df_old, preview_strategy))
        header_stats = json.loads(get_dataframe_header_stats(df, df_old is not None))
        column_stats = list(
            map(
                lambda i: json.loads(
                    get_dataframe_column_stats(
                        df,
                        df_old is not None,
                        i,
                        True,
                    )
                ),
                range(len(df.columns) + 1),
            )
        )
        summary = {
            "header": header,
            "header_stats": header_stats,
            "column_stats": column_stats,
        }
        # use this when creating a new test
        if generate_tests:
            save_json(summary, df_header_path)
        with open(df_header_path, "r", encoding="utf-8") as summary_expected:
            summary_expected = json.loads(summary_expected.read())
        self.assertDictEqual(summary, summary_expected)

    def test_get_dataframe_info_no_preview(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        self.assertDataFrameSummaryEqual(
            df,
            os.path.join(dirname, "testFiles", "summary", "titanic_summary.json"),
            None,
            None,
        )

    def test_get_dataframe_info_preview_dropna(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df2 = df.dropna(subset=["Cabin"])
        self.assertDataFrameSummaryEqual(
            df2,
            os.path.join(
                dirname, "testFiles", "summary", "titanic_summary_dropna.json"
            ),
            df,
            "AddedOrRemovedRows",
        )

    def test_sparse(self):
        arr = np.arange(0, 2, 0.2, dtype=np.float64)
        arr[2:-2] = np.nan
        sparse_float64_series = pd.Series(pd.arrays.SparseArray(arr))

        arr = np.arange(0, 20, 2, dtype=np.int32)
        arr[2:-2] = 0
        sparse_int32_series = pd.Series(pd.arrays.SparseArray(arr))

        arr = ["a", "b", "b", None, None, None, None, "c", "c", "c"]
        sparse_string_series = pd.Series(pd.arrays.SparseArray(arr))

        df = pd.DataFrame(
            dict(
                sparse_float64=sparse_float64_series,
                sparse_int32=sparse_int32_series,
                sparse_string=sparse_string_series,
            )
        )

        self.assertDataFrameSummaryEqual(
            df,
            os.path.join(dirname, "testFiles", "summary", "sparse_summary.json"),
            None,
            None,
        )

    def test_non_string_column_keys(self):
        df = pd.DataFrame({0: [0], "'\"": [0], (1, "a"): [0], True: [0], 1 + 5j: [0]})
        self.assertDataFrameSummaryEqual(
            df,
            os.path.join(dirname, "testFiles", "summary", "non_string_summary.json"),
            None,
            None,
        )

    def test_non_hashable_data(self):
        a, b, c = [1, 2, 3], (4, 5, 6), {"7": 8, "9": 0}
        # Ensure that there is a unique number of each so the top 3 order is consistent
        df = pd.DataFrame({0: [a, b, b, c, c, c]})
        self.assertDataFrameSummaryEqual(
            df,
            os.path.join(dirname, "testFiles", "summary", "non_hashable_summary.json"),
            None,
            None,
        )

    def df_mangle_dupe_cols(self, df):
        counter = {}
        for idx, column in enumerate(list(df.columns)):
            if column in counter:
                df.columns.values[idx] = "%s.%d" % (column, counter[column])
                counter[column] += 1
            else:
                counter[column] = 1
        return df

    def format_row_annotations(self, row_annotations):
        res = {}
        for idx in row_annotations.index:
            entry = {}
            for col in row_annotations:
                if row_annotations.loc[idx, col]:
                    entry[col] = row_annotations.loc[idx, col]
            if len(entry):
                res[idx] = entry
        return res

    def assertPreviewDataFramesEqual(
        self,
        df,
        df_2,
        preview_strategy,
        preview_df_path,
        annotations_path,
        generate_tests=False,
    ):
        (
            preview_df,
            column_annotations,
            row_annotations,
            preview_strategy,
            is_equal,
        ) = create_preview_dataframe(df_2, df, preview_strategy)
        annotations = {
            "columns": column_annotations,
            "rows": self.format_row_annotations(row_annotations),
        }
        # use this when creating a new test
        if generate_tests:
            save_df_csv(preview_df, preview_df_path)
            save_json(annotations, annotations_path)
        # see https://github.com/pandas-dev/pandas/issues/13262 - we need to mangle the columns on the preview ourselves
        preview_df_expected = pd.read_csv(
            preview_df_path, index_col=0, float_precision="round_trip"
        )
        self.df_mangle_dupe_cols(preview_df)
        self.assertEqual(preview_df.to_csv(), preview_df_expected.to_csv())
        with open(annotations_path, "r", encoding="utf-8") as annotations_expected:
            annotations_expected = json.loads(annotations_expected.read())
        self.assertEqual(json.dumps(annotations), json.dumps(annotations_expected))

    def test_get_dataframe_row_datetime_serialization(self):
        datetime_tzd_series = pd.Series(
            np.append(
                pd.date_range("2012-1-1", periods=9, freq="D").to_numpy(), [pd.NaT]
            ),
            dtype=pd.DatetimeTZDtype(tz="America/New_York"),
        )
        df = pd.DataFrame(dict(datetime_tzd=datetime_tzd_series))
        rows = get_dataframe_rows(df, False, 0, 0, 1, 99999)
        self.assertEqual(rows, '1;0;33;[[0,"2012-01-01 00:00:00-05:00"]]')

    def get_col_annotations(self, info_json):
        return list(map(lambda col: col["annotations"] if "annotations" in col else None, info_json["columns"]))

    def test_get_dataframe_row_dupe_keys(self):
        df = pd.DataFrame({'b': [1, 1, 2, 2], 'a': [5, 6, 7, 8], 'c': [9, 10, 11, 12]})
        df = df.set_index('b')
        df2 = df.copy()
        df2.iloc[1]['a'] = 1
        info = json.loads(get_dataframe_info(df2, df, "Infer"))
        self.assertEqual(info["previewStrategy"], "ModifiedColumns")
        rows = get_dataframe_rows(df2, True, 0, 0, 999999, 99999)
        self.assertEqual(rows, '4;0;122;[[1,5,5,9],{"_modified":""}],[[1,6,1,10],{"_modified":" 1 2"}],[[2,7,7,11],{"_modified":""}],[[2,8,8,12],{"_modified":""}]')
        self.assertEqual(self.get_col_annotations(info), [None, {'annotationType': 'removed'}, {'annotationType': 'added'}, None])

        df2 = df[(df['a'] != 6) & (df['a'] != 7)]
        info = json.loads(get_dataframe_info(df2, df, "Infer"))
        rows = get_dataframe_rows(df2, True, 0, 0, 999999, 99999)
        self.assertEqual(info["previewStrategy"], "None")
        self.assertEqual(rows, '2;0;20;[[1,5,9]],[[2,8,12]]')
        self.assertEqual(self.get_col_annotations(info), [None, None, None])

    def test_preview_change_column_type_single(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_change_column_type = df.astype({"Survived": "float64"})
        # TODO@DW: the annotations for this are wrong
        self.assertPreviewDataFramesEqual(
            df,
            df_change_column_type,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "change_column_type",
                "titanic_change_column_type_survived_to_bool_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "change_column_type",
                "titanic_change_column_type_survived_to_bool_preview_annotations.json",
            ),
        )

    def test_preview_drop_column_single(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_column = df.drop(columns=["Survived"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_column,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_survived_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_survived_preview_annotations.json",
            ),
        )

    def test_preview_drop_column_multiple(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_column = df.drop(columns=["Survived", "Name", "Age"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_column,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_survived_name_age_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_survived_name_age_preview_annotations.json",
            ),
        )
        self.assertDataFrameSummaryEqual(
            df_drop_column,
            os.path.join(
                dirname, "testFiles", "summary", "titanic_summary_drop_columns.json"
            ),
            df,
            "ModifiedColumns",
        )

    def test_preview_drop_and_modify_column(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_column = df.drop(columns=["Survived", "Name"])
        df_drop_column["Age"] *= 2
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_column,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_and_modify_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_column",
                "titanic_drop_and_modify_preview_annotations.json",
            ),
        )

    def test_preview_drop_and_modify_rows(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        ).sort_values(
            "Name"  # Sorting the values helps test that the index doesn't get auto-sorted
        )
        df_drop_rows = df.dropna()  # Drop some rows
        df_drop_rows *= 2  # Modify some rows
        df_drop_rows.loc[1000] = df_drop_rows.loc[1]  # Duplicate a row
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_rows,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_and_modify_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_and_modify_preview_annotations.json",
            ),
        )

    def test_preview_drop_duplicates_single(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_duplicates = df.drop_duplicates(subset=["Age"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_duplicates,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_age_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_age_preview_annotations.json",
            ),
        )

    def test_preview_drop_duplicates_single_all_unique(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_duplicates = df.drop_duplicates(subset=["PassengerId"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_duplicates,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_passenger_id_all_unique_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_passenger_id_all_unique_preview_annotations.json",
            ),
        )

    def test_preview_drop_duplicates_multiple(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_duplicates = df.drop_duplicates(subset=["Age", "Pclass"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_duplicates,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_age_pclass_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_duplicates",
                "titanic_drop_duplicates_in_age_pclass_preview_annotations.json",
            ),
        )

    def test_preview_drop_na_single(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_na = df.dropna(subset=["Age"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_na,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_na_in_age_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_na_in_age_preview_annotations.json",
            ),
        )

    def test_preview_drop_na_multiple(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_drop_na = df.dropna(subset=["Age", "Cabin"])
        self.assertPreviewDataFramesEqual(
            df,
            df_drop_na,
            "AddedOrRemovedRows",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_na_in_age_cabin_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "drop_na",
                "titanic_drop_na_in_age_cabin_preview_annotations.json",
            ),
        )

    def test_preview_fill_na(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_fill_na = df.fillna({"Age": 0})
        # TODO@DW annotations and preview are off
        self.assertPreviewDataFramesEqual(
            df,
            df_fill_na,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "fill_na",
                "titanic_fill_na_in_age_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "fill_na",
                "titanic_fill_na_in_age_preview_annotations.json",
            ),
        )

    def test_preview_normalize(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        new_min, new_max = 0, 10
        df_2 = df.copy()
        old_min, old_max = df[["Age"]].min(), df[["Age"]].max()
        df_2["Age"] = (df[["Age"]] - old_min) / (old_max - old_min) * (
            new_max - new_min
        ) + new_min
        self.assertPreviewDataFramesEqual(
            df,
            df_2,
            "ModifiedColumns",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "normalize",
                "titanic_normalize_age_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "normalize",
                "titanic_normalize_age_preview_annotations.json",
            ),
        )

    def test_preview_groupby_and_agg(self):
        df = pd.read_csv(
            os.path.join(dirname, "testFiles", "titanic.csv"),
            float_precision="round_trip",
        )
        df_2 = (
            df.groupby(["Survived", "Pclass"])
            .agg(Age_mean=("Age", "mean"))
            .reset_index()
        )
        self.assertPreviewDataFramesEqual(
            df,
            df_2,
            "SideBySide",
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "group_by_and_aggregate",
                "titanic_groupby_agg_preview.csv",
            ),
            os.path.join(
                dirname,
                "testFiles",
                "column_operation",
                "group_by_and_aggregate",
                "titanic_groupby_agg_preview_annotations.json",
            ),
        )
        self.assertDataFrameSummaryEqual(
            df_2,
            os.path.join(
                dirname, "testFiles", "summary", "titanic_summary_groupby_and_agg.json"
            ),
            df,
            "SideBySide",
        )


if __name__ == "__main__":
    unittest.main()
