"""
Note: all executions are function-scoped as we do not assume the code below executes in an isolated kernel environment.
"""


def __DW_DATAFRAME__(session):
    """
    Helpers to query dataframe information.
    """
    # Import builtins used here so we won't error if they are overwritten in the kernel.
    from builtins import (
        AttributeError,
        bool,
        complex,
        dict,
        enumerate,
        Exception,
        hasattr,
        id,
        int,
        isinstance,
        len,
        list,
        map,
        range,
        repr,
        round,
        set,
        str,
        sum,
        tuple,
        type,
        TypeError,
    )
    import json
    import math
    import re
    import numbers

    preview_dataframes = {}
    preview_annotations = {}

    def map_dtype_to_dw_type(dtype, inferred_dtype=None):
        """
        References to known types:
        - Pandas: https://stackoverflow.com/a/29246498
        - NumPy: https://numpy.org/doc/stable/reference/arrays.scalars.html

        Note: the types here do not necessarily include all NumPy types, but rather
        what type Pandas uses when the type is used as input. For example, NumPy
        supports several precision for datetimes, while Pandas internally only uses
        nanoseconds, see https://github.com/pandas-dev/pandas/issues/6741#issuecomment-39026803

        Note that the value mapped here is used for the following purposes:
        - To figure out what "picker" should be used for this type in the UI, e.g. when replacing
        - To figure out what operations should be associated with this type in the UI
        """
        # string types
        if dtype == "string" or (dtype == "object" and inferred_dtype == "string"):
            return "string"

        # category types
        # TODO@DW: enable this
        # if dtype == "category":
        #     return "category"

        # float types
        # TODO@DW: consider if we need to distinguish nullable types
        # or pass it along as metadata for certain operations
        if re.fullmatch(r"(?:float|Float)\d+", dtype):
            return "float"

        # int types
        # TODO@DW: consider if we need to distinguish nullable types
        # or pass it along as metadata for certain operations
        if re.fullmatch(r"(?:int|uint|Int|UInt)\d+", dtype):
            return "integer"

        # complex types
        # TODO@DW: enable this
        # if re.fullmatch("complex\d+", dtype):
        #     return "complex"

        # boolean types
        # TODO@DW: consider if we need to distinguish nullable types
        # or pass it along as metadata for certain operations
        if dtype in ["bool", "boolean"]:
            return "boolean"

        # datetime types
        # TODO@DW: handle timezone-specific datetimes
        if dtype == "datetime64[ns]":
            return "datetime"

        # timedelta types
        # TODO@DW: enable this
        # if dtype == "timedelta64[ns]":
        #     return "timedelta"

        # period types
        # TODO@DW: enable this
        # if re.fullmatch(r"period[.*]", dtype):
        #    return "period"

        # interval types
        # TODO@DW: we will need to pass the metadata of the interval type as well
        # interval_match = re.fullmatch(r"interval[(.*), .*]", dtype)
        # if interval_match:
        #    return map_dtype_to_dw_type(interval_match.group(1))

        # sparse types

        # TODO@DW: sparse types don't well for us because they don't support assignments,
        # e.g. https://github.com/pandas-dev/pandas/issues/21818 or describe calls.
        # For now we can just render them, but not support operations on them yet.

        # for sparse types, they're essentially just more compact versions of the
        # type that they wrap around, so we can just extract that part instead
        # sparse_match = re.fullmatch(r"(?:Sparse\[(.*), .*\]|Sparse\[(.*)\])", dtype)
        # if sparse_match:
        #     return map_dtype_to_dw_type(sparse_match.group(1))

        # default to unknown
        return "unknown"

    def get_dataframe_header_stats(df, is_preview):
        """
        Returns stats for the given dataframe.
        """
        # defer import of package dependencies
        import pandas as pd
        import numpy as np

        dataframe_stats = {}

        # Counting nulls one column at a time reduces memory overhead and improves perf.
        missing_columns = []
        missing_rows = pd.Series(0, index=df.index, dtype=np.int64)
        for i in range(len(df.columns)):
            col = df.iloc[:, i]
            if hasattr(col, "sparse"):
                col = col.sparse.to_dense()
            nulls = col.isnull()
            missing_rows += nulls
            missing_columns.append(nulls.sum())

        dataframe_stats["missingValueCellsCount"] = int(sum(missing_columns))
        dataframe_stats["missingValueRowsCount"] = int(
            np.count_nonzero(missing_rows > 0)
        )

        # For preview dataframes, statistics generally are just calculated for the new df.
        # However the missing column indices must be adjusted to account for removed rows.
        # Note that this assumes the order of columns in the new df is the same in the preview.
        if is_preview and id(df) in preview_dataframes:
            column_annotations = preview_annotations[id(df)]["column_annotations"]
            if column_annotations:
                preview_df = preview_dataframes[id(df)]
                new_idx = 0
                preview_missing_columns = []
                for preview_idx in range(len(preview_df.columns)):
                    annotations = column_annotations.get(str(preview_idx + 1))
                    if annotations and annotations.get("annotationType") == "removed":
                        preview_missing_columns.append(None)
                    else:
                        preview_missing_columns.append(missing_columns[new_idx])
                        new_idx += 1
                missing_columns = preview_missing_columns

        dataframe_stats["missingValuesByColumn"] = [
            0,  # Add 0 for the index column
            *[int(x) if x is not None else x for x in missing_columns],
        ]

        try:
            dataframe_stats["duplicateRowsCount"] = int(
                np.count_nonzero(df.duplicated(keep="first"))
            )
        except TypeError as e:
            # if we have unhashable types, we can naively try casting to string first
            dataframe_stats["duplicateRowsCount"] = int(
                np.count_nonzero(df.astype(str).duplicated(keep="first"))
            )
            pass

        # Size takes a long time to calculate for large datasets, and isn't current displayed in the client.
        # So it has been disabled for now.
        # try:
        #     # calculate size information in bytes
        #     dataframe_stats["size"] = int(
        #         df.memory_usage(index=True, deep=True).sum()
        #     )
        # except TypeError as e:
        #     # one way to break this is to pass in a class, e.g. pd.DataFrame without instantiating it
        #     pass

        return json.dumps(dataframe_stats)

    def get_dataframe_column_stats(
        df, is_preview, column_index, exclude_top_value=False
    ):
        """
        Returns stats for the dataframe column at the given index.

        exclude_top_value should be set to True when testing as the top value returned by describe is
        not deterministic.
        """
        # defer import of package dependencies
        import pandas as pd
        import numpy as np
        from pandas.api.types import (
            is_numeric_dtype,
            is_bool_dtype,
            is_datetime64_dtype,
            is_integer_dtype,
        )

        row_annotations = None
        column_annotations = None
        if is_preview and id(df) in preview_dataframes:
            row_annotations = preview_annotations[id(df)]["row_annotations"]
            column_annotations = preview_annotations[id(df)]["column_annotations"]
            df = preview_dataframes[id(df)]

        # Use column index rather than name to avoid issues with duplicate column names,
        # E.g. in a preview dataframe when changing the column type.
        # Subtract 1 to account for index column
        column = df.index if column_index == 0 else df.iloc[:, column_index - 1]

        # If we have a SxS diff, make sure the column lengths are correct
        if column_annotations and str(column_index) in column_annotations:
            if "dataEndIndex" in column_annotations[str(column_index)]:
                column = column[
                    : column_annotations[str(column_index)]["dataEndIndex"] + 1
                ]

        # If there are row annotations, do not count any rows that have been removed.
        if row_annotations is not None and "_type" in row_annotations:
            column = column[row_annotations["_type"] != "removed"]

        # handle sparse columns
        # TODO@DW: Investigate ways to avoid converting to dense for performance.
        if hasattr(column, "sparse"):
            column = column.sparse.to_dense()

        total = int(column.size)
        missing = int(column.isnull().sum())

        column_stats = {"missingCount": missing}

        try:
            column_stats["uniqueCount"] = int(column.nunique())
        except TypeError:
            # The data is not hashable. Just skip the calculation.
            pass

        # For index column, just return the basic stats
        if column_index != 0:
            try:
                column_type = column.dtype

                if is_bool_dtype(column_type):
                    counts = column.value_counts()
                    column_stats["visualization"] = {
                        "type": "boolean",
                        "trueCount": int(counts[True]) if True in counts else 0,
                        "falseCount": int(counts[False]) if False in counts else 0,
                    }
                elif is_numeric_dtype(column_type):
                    column_description = column.describe()

                    # if mean exists in the describe, then this is a numerical description
                    is_numerical_summary = "mean" in column_description
                    if is_numerical_summary:
                        try:
                            column_description["kurtosis"] = column.kurtosis()
                            column_description["skew"] = column.skew()
                        except:
                            pass
                        numerical_data = {}
                        for property_name in [
                            "mean",
                            "min",
                            "25%",
                            "50%",
                            "75%",
                            "max",
                            "std",
                            "kurtosis",
                            "skew",
                        ]:
                            if property_name not in column_description:
                                continue

                            if (
                                # make sure that we cast appropriately to string
                                # for unsupported numerical types, e.g. dates and complex numbers
                                not isinstance(
                                    column_description[property_name], numbers.Number
                                )
                                or isinstance(
                                    column_description[property_name], complex
                                )
                                or math.isnan(column_description[property_name])
                                or math.isinf(column_description[property_name])
                            ):
                                # Use string "nan", "inf", "-inf" instead of numerical NaN/Inf/-Inf values to avoid having invalid JSON, since JSON doesn't support the latter.
                                numerical_data[property_name] = str(
                                    column_description[property_name]
                                )
                            else:
                                numerical_data[property_name] = column_description[
                                    property_name
                                ]
                        # Special naming for median
                        numerical_data["median"] = numerical_data.pop("50%")
                        column_stats["numericalData"] = numerical_data

                    # Now calculate the histogram
                    [min, max] = column.agg(["min", "max"])

                    # The maximum number of bins to use. The real number will be determined based on the "smartest" bin size.
                    max_bins = 20

                    # Whether the bins are for a range of values. False for integer data that can fit in fewer than `maxBins`.
                    is_range = not (
                        is_integer_dtype(column_type) and max - min + 1 <= max_bins
                    )
                    # The minimum number of decimal places required to differentiate the data when split into `maxBins` bins.
                    log_scale = math.floor(math.log10((max - min + 1) / max_bins))
                    # Numerical multiplier for the bins. For non-ranges, always count by 1.
                    scale = math.pow(10, log_scale) if is_range else 1
                    # The size of each bin in multiples of `scale`. This is the smallest n such that (max - min) / (scale * n) < maxBins
                    bin_size = (
                        math.ceil((max - min) / (scale * max_bins)) if is_range else 1
                    )
                    # The actual numerical width of each bin.
                    bin_width = scale * bin_size

                    # Now generate the bins.
                    # Start by rounding the maximum value up to a multiple of the bin scale and the minimum down.
                    max_bin = bin_width * math.ceil(max / bin_width)
                    min_bin = bin_width * math.floor(min / bin_width)

                    boundaries = np.arange(
                        # If we are dealing with a range, make the lowest bin left-closed. Otherwise use a separate bin for each value.
                        min_bin if is_range else min_bin - bin_width,
                        # go to `max_bin` inclusive, but not over
                        max_bin + bin_width / 2,
                        bin_width,
                    )
                    bins = (
                        # bin labels are the max values of the bins since these are always inclusive
                        pd.cut(
                            column,
                            boundaries,
                            include_lowest=is_range,
                            labels=boundaries[1:],
                        )
                        .value_counts()
                        .sort_index()
                    )

                    column_stats["visualization"] = {
                        "type": "numerical",
                        "min": min,
                        "max": max,
                        "binPrecision": 0
                        if (log_scale > 0 or not is_range)
                        else -log_scale,
                        "bins": [],
                    }

                    for bin in bins.index:
                        column_stats["visualization"]["bins"].append(
                            {
                                # round the values to handle precision errors
                                "min": round(
                                    bin - bin_width if is_range else bin, -log_scale
                                ),
                                "max": round(bin, -log_scale),
                                "count": int(
                                    bins[[bin]].iloc[0]
                                ),  # this syntax is a bit convoluted but is necessary for backwards compat
                            }
                        )
                elif is_datetime64_dtype(column_type):
                    [min, max] = column.agg(["min", "max"])
                    column_stats["visualization"] = {
                        "type": "datetime",
                        "min": min.isoformat(),
                        "max": max.isoformat(),
                    }
                else:
                    top_3 = column.value_counts().head(3)
                    categorical_data = {}
                    top = {}

                    # this value is not deterministic, so for testing we don't include it
                    if not exclude_top_value:
                        top["value"] = str(top_3.index[0]) if len(top_3) > 0 else "NaN"
                    top["frequency"] = int(top_3.iloc[0]) if len(top_3) > 0 else 0
                    categorical_data["top"] = top
                    column_stats["categoricalData"] = categorical_data

                    top_3_total = int(top_3.sum())
                    # Only return top 3 if they account for more than 20% of the values present
                    if top_3_total * 5 >= (total - missing):
                        column_stats["visualization"] = {
                            "type": "categorical",
                            "categories": [
                                {
                                    "label": str(label),
                                    "count": int(count),
                                }
                                for (label, count) in top_3.items()
                            ],
                            "other": total - missing - top_3_total,
                        }

            except Exception as e:
                import warnings

                warnings.warn(str(e))

        # handle numpy types if they show up in stats
        def np_encoder(object):
            if isinstance(object, np.generic):
                return object.item()

        return json.dumps(column_stats, default=np_encoder)

    def get_dataframe_info(df, df_old=None, preview_strategy=None):
        """
        Returns info for the given dataframe.

        If df_old is provided, this returns a preview dataframe representing the
        dataframe transitioning from df_old to df. For grid annotations (e.g. highlighted columns),
        preview_strategy can be specified to optimize for particular scenarios.
        """
        import pandas as pd

        if not isinstance(df, pd.DataFrame):
            # This error message is detected in the client and handled specially
            raise TypeError("DW_NOT_A_DATAFRAME " + str(type(df)))

        dataframe_info = {}

        # define shape information
        shape = {}
        shape["rows"], shape["columns"] = df.shape
        dataframe_info["shape"] = shape

        try:
            index_column_name = df.index.name if df.index.name else "index"
        except AttributeError:
            index_column_name = "index"
        dataframe_info["indexColumnKey"] = index_column_name

        column_annotations = {}
        df_new = df
        if df_old is not None:
            (
                preview_df,
                column_annotations,
                row_annotations,
                preview_strategy,
                is_equal,
            ) = create_preview_dataframe(df, df_old, preview_strategy)
            dataframe_info["oldShape"] = {
                "rows": df_old.shape[0],
                "columns": df_old.shape[1],
            }
            dataframe_info["previewShape"] = {
                "rows": preview_df.shape[0],
                "columns": preview_df.shape[1],
            }
            dataframe_info["isPreviewUnchanged"] = is_equal
            # For "infer" preview strategy, we need to pass the inferred strategy back.
            dataframe_info["previewStrategy"] = preview_strategy
            dataframe_info["isPreview"] = True
            df = preview_df

        column_types = list(df.dtypes)
        column_names = list(df)

        # define column metadata
        column_info_list = []
        for column_idx in range(0, len(column_names)):
            # for each column, figure out the type and name
            raw_column_type = str(column_types[column_idx])
            column_name = column_names[column_idx]

            # In some older versions of Pandas, infer_dtype does not support sparse columns
            column = df[column_name]
            if hasattr(column, "sparse"):
                column = column.sparse.to_dense()
            inferred_dtype = pd.api.types.infer_dtype(column, skipna=True)

            column_type = map_dtype_to_dw_type(raw_column_type, inferred_dtype)
            column_str_name = str(column_name)
            column_raw_name = repr(column_name)

            column_info = {}
            column_info["name"] = column_str_name
            column_info["key"] = column_raw_name
            column_info["index"] = column_idx + 1
            column_info["type"] = column_type
            column_info["rawType"] = raw_column_type
            column_info["isMixed"] = inferred_dtype.startswith("mixed")

            column_idx_str = str(column_idx + 1)
            if column_idx_str in column_annotations:
                column_info["annotations"] = column_annotations[column_idx_str]

            is_removed = (
                column_info.get("annotations", {}).get("annotationType") == "removed"
            )
            # Base the column length on the original dataframes and not the preview.
            column_info["totalCount"] = len(
                df_old.index if is_removed else df_new.index
            )

            # add the column result
            column_info_list.append(column_info)

        # Make sure the index column exists
        index_column_info = {}
        index_column_info["name"] = index_column_name
        index_column_info["index"] = 0
        index_column_info["rawType"] = str(df.index.dtype)
        index_column_info["type"] = map_dtype_to_dw_type(index_column_info["rawType"])
        column_info_list.insert(0, index_column_info)

        dataframe_info["columns"] = column_info_list

        return json.dumps(dataframe_info)

    def create_preview_dataframe(df_new, df_old, preview_strategy):
        # defer import of package dependencies
        import pandas as pd
        import numpy as np

        if preview_strategy == "Infer":
            columns_changed = not df_new.columns.equals(df_old.columns)
            index_changed = not df_new.index.equals(df_old.index)

            if columns_changed and index_changed:
                preview_strategy = "SideBySide"
            elif index_changed:
                # If the index just changed order, don't do a diff.
                if (
                    df_new.size == df_old.size
                    and df_new.index.symmetric_difference(df_old.index, sort=False).size
                    == 0
                ):
                    preview_strategy = "None"
                else:
                    preview_strategy = "AddedOrRemovedRows"
            else:
                preview_strategy = "ModifiedColumns"

        # Only allow modified columns strategy for duplicate columns
        # TODO@DW: investigate adding support for other preview strategy types
        if (df_old.index.has_duplicates or df_new.index.has_duplicates) and preview_strategy != "ModifiedColumns":
            preview_strategy = "None"

        column_annotations = {}
        row_annotations = pd.DataFrame()
        preview_df = df_new
        is_equal = df_old.equals(df_new)

        if is_equal:
            pass  # No need to diff if nothing has changed
        elif preview_strategy == "ModifiedColumns":
            """
            Detect added, removed, or modified columns.
            """
            preview_df = df_new.copy()
            row_annotations = pd.DataFrame(index=preview_df.index)
            row_annotations["_modified"] = ""

            new_column_names = list(df_new)
            old_column_names = list(df_old)
            old_len = len(old_column_names)
            new_len = len(new_column_names)
            new_column_names_set = set(df_new)
            old_column_names_set = set(df_old)
            added_column_names = new_column_names_set - old_column_names_set
            removed_column_names = old_column_names_set - new_column_names_set

            i = j = 0
            k = 1  # make sure to account for index column
            while i < old_len or j < new_len:
                # Walk through any removed columns in the old df
                while i < old_len and old_column_names[i] in removed_column_names:
                    column_annotations[str(k)] = {"annotationType": "removed"}
                    name = old_column_names[i]
                    preview_df.insert(k - 1, name, df_old[name])
                    i += 1
                    k += 1

                # Walk through any added columns in the new df
                while j < new_len and new_column_names[j] in added_column_names:
                    column_annotations[str(k)] = {"annotationType": "added"}
                    # New column is already present in preview_df
                    j += 1
                    k += 1

                # If we are still within the new df, diff the current column with the old df
                if j < new_len:
                    name = new_column_names[j]
                    data_changed = not df_old[name].equals(df_new[name])
                    type_changed = df_old[name].dtype != df_new[name].dtype
                    if data_changed or type_changed:
                        if data_changed:
                            # we need to check for missing values first so that pd.NA doesn't propagate
                            eq_mask = (df_old[name].isna() & df_new[name].isna()) | (
                                df_old[name] == df_new[name]
                            )

                            # _modified stores a space-separated list of modified column indices
                            row_annotations.loc[~eq_mask, "_modified"] += (
                                " " + str(k) + " " + str(k + 1)
                            )

                        column_annotations[str(k)] = {"annotationType": "removed"}
                        column_annotations[str(k + 1)] = {"annotationType": "added"}
                        preview_df.insert(
                            k - 1,
                            name,
                            df_old[name],
                            allow_duplicates=True,
                        )
                        # New column is already in the preview_df
                        k += 1

                # Step forward
                i += 1
                j += 1
                k += 1
        elif preview_strategy == "AddedOrRemovedRows":
            """
            Detect added or removed columns.
            """

            removed_rows = df_old.index.difference(df_new.index)
            added_rows = df_new.index.difference(df_old.index)

            # Ensure that we prefer rows from df_new, in case there are also changes to the values.
            # Use an index union to try to preserve the row order.
            preview_df = pd.concat([df_old.loc[removed_rows], df_new]).reindex(
                index=df_old.index.union(df_new.index, sort=False)
            )
            row_annotations = pd.DataFrame(index=preview_df.index)

            row_annotations["_type"] = None
            row_annotations["_type"][removed_rows] = "removed"
            row_annotations["_type"][added_rows] = "added"
        elif preview_strategy == "SideBySide":
            """
            If we aren't sure what to show, just concat the new and old data frames side-by-side.
            """
            preview_df = pd.concat([df_new, df_old], axis=1)
            for i, new_column_name in enumerate(df_new.columns):
                idx = 1 + i  # account for index column
                column_annotations[str(idx)] = {"annotationType": "added"}
                if len(df_new.index) < len(df_old.index):
                    column_annotations[str(idx)]["dataEndIndex"] = len(df_new.index) - 1
            for i, old_column_name in enumerate(df_old.columns):
                idx = (
                    1 + len(df_new.columns) + i
                )  # account for index column and old columns
                column_annotations[str(idx)] = {
                    "annotationType": "removed",
                }
                if len(df_old.index) < len(df_new.index):
                    column_annotations[str(idx)]["dataEndIndex"] = len(df_old.index) - 1

        # store a mapping of the dataframe to its preview and row annotations
        preview_dataframes[id(df_new)] = preview_df
        preview_annotations[id(df_new)] = {
            "row_annotations": row_annotations,
            "column_annotations": column_annotations,
        }

        return (
            preview_df,
            column_annotations,
            row_annotations,
            preview_strategy,
            is_equal,
        )

    def get_dataframe_rows(df, is_preview, rowIndex, inlineIndex, rowLimit, dataLimit):
        """
        Retrieves rows from the given dataframe between start and end inclusive.

        The result from this function is a custom format so that we can precisely control the length.
        Using JSON would require some characters to be escaped, which is tricky to account for efficiently.

        The output format is a string of the form:
            <rowIndex>;<inlineIndex>;<rowDataLength>;<completeRowData><partialRowData>
        Where each part is as follows:
            rowIndex:           The row index that should be next requested.
            inlineIndex:        The character position to start in the row in the next request.
                                    This allows us to support rows/cells that are longer than the dataLimit.
            rowDataLength:      The length of completeRowData. Since the data can have arbitrary content,
                                    we use the length to determine where completeRowData ends and where partialRowData begins.
            completeRowData:    This data can be combined with previous partial data and deserialized as JSON.
            partialRowData:     This data comprises part of a row, and should be combined with subsequent requests.

        """
        # defer imports of package dependencies
        import pandas.io.json as pd_json
        import pandas as pd
        import numpy as np

        row_annotations = None
        if is_preview and id(df) in preview_dataframes:
            row_annotations = preview_annotations[id(df)]["row_annotations"]
            df = preview_dataframes[id(df)]

        def serialize(x):
            # note: pd.NA doesn't return a bool when using ==
            # we also ignore any non-bool results, which can occur when x is list-like
            na_check = pd.isna(x)
            if isinstance(na_check, bool) and na_check:
                return None
            if x == np.inf:
                return "inf"
            if x == -np.inf:
                return "-inf"
            if isinstance(x, (dict, list, tuple, complex, pd.Timestamp)):
                return str(x)
            return x

        # To keep the result from being longer than dataLimit, we build it ourselves.
        # padding accounts for the extra size from the header data.
        #   Note that this assumes the end row, inline index, and data langth add up to no more than 97 digits.
        #   This should be safe as 2^64 only has 20 digits, and above that we will have much bigger problems.
        padding = 100
        completeRows = ""
        partialRow = ""
        isFirstRow = True

        for idx in range(rowIndex, min(rowIndex + rowLimit, len(df.index))):
            key = df.index[idx]
            row = df.iloc[idx]

            # Transit format is [[<index key>, ...<row_data>](, <annotations>)]
            data = [[key, *map(serialize, row)]]
            if row_annotations is not None and key in row_annotations.index:
                # Make sure to use iloc in case there are non-unique keys
                data.append(row_annotations.iloc[idx].to_dict())

            # Check if we can include this row without going over the limit. + 100 for padding
            rowJSON = pd_json.dumps(data, iso_dates=True, default_handler=str)

            # If this is the first row, slice based on the inlineIndex.
            if isFirstRow:
                rowJSON = rowJSON[inlineIndex:]

            # + 1 to account for the comma we might add.
            if len(completeRows) + len(rowJSON) + padding + 1 < dataLimit:
                if not isFirstRow:
                    completeRows += ","
                completeRows += rowJSON
                inlineIndex = 0
                rowIndex += 1
                isFirstRow = False
            else:
                charsToSend = dataLimit - len(completeRows) - padding
                inlineIndex += charsToSend
                partialRow = rowJSON[:charsToSend]
                break

        return "{};{};{};{}{}".format(
            rowIndex, inlineIndex, len(completeRows), completeRows, partialRow
        )

    def remove_preview_item(df):
        if id(df) in preview_dataframes:
            del preview_dataframes[id(df)]
            del preview_annotations[id(df)]

    def read_string_in_chunks(str, start, data_limit):
        if start + data_limit >= len(str):
            return json.dumps(
                {"raw": str[start:], "readPosition": len(str), "done": True}
            )
        return json.dumps(
            {
                "raw": str[start : start + data_limit],
                "readPosition": start + data_limit,
                "done": False,
            }
        )

    # namespace exports
    return dict(
        get_dataframe_info=get_dataframe_info,
        get_dataframe_header_stats=get_dataframe_header_stats,
        get_dataframe_column_stats=get_dataframe_column_stats,
        get_dataframe_rows=get_dataframe_rows,
        remove_preview_item=remove_preview_item,
        create_preview_dataframe=create_preview_dataframe,
        read_string_in_chunks=read_string_in_chunks,
    )
