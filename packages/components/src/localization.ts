/**
 * Localized strings for wrangler components.
 */
export namespace LocalizedStrings {
    /**
     * Localized strings for the grid.
     */
    export const Grid = {
        HeaderButtonAcceptPreview: "Accept preview",
        HeaderButtonContextMenuMoreOptions: "More options...",
        HeaderContextMenuGridOperationSortAscending: "Sort ascending",
        HeaderContextMenuGridOperationSortDescending: "Sort descending",
        HeaderContextMenuGridOperationFilter: "Filter",
        CellContextMenuGridOperationCopy: "Copy cell",
        CellContextMenuGridOperationCopyRow: "Copy row",
        CellContextMenuGridOperationCopyRows: "Copy rows",
        CellEditPlaceholder: "Enter an example",
        CellMissingValue: "Missing value",
        QuickInsightsLoading: "Loading...",
        QuickInsightsPaused: "Paused.",
        QuickInsightsMissingLabel: "Missing",
        QuickInsightsUniqueLabel: "Unique",
        QuickInsightsTrueLabel: "True",
        QuickInsightsFalseLabel: "False",
        QuickInsightsOtherCategoryLabel: "Other",
        QuickInsightsMinLabel: "Min",
        QuickInsightsMaxLabel: "Max",
        QuickInsightsUniqueValuesLabel: "Unique values",
        TargetDisabledSingleColumnOnly: "This operation does not support multiple columns",
        TargetDisabledMixedColumn: "Mixed columns are not allowed for this operation",
        TargetDisabledUnknownType: "Type '{0}' is currently an unsupported type",
        TargetDisabledTypeMismatch: "Type '{0}' is not allowed for this operation",
        TargetDisabledTypesNotSame: "All column types must be the same type for this operation",
        CellIconEditSuccess: "Edit was successful",
        CellIconEditFailed: "Edit failed",
        CellIconEditSuggested: "Providing an edit for this cell can improve results"
    };

    /**
     * Localized strings for the operation panel.
     */
    export const Operations = {
        SearchForOperationsPlaceholder: "Search for operations...",
        BackToResultsButtonText: "Back to results",
        BackToAllOperationsButtonText: "Back to all operations",
        BackToCurrentOperation: "Back to current operation",
        InitialStateName: "Imported data into Data Wrangler",
        PreviewCodeButtonText: "Preview",
        AcceptCodeButtonText: "Apply",
        ClearPreviewButtonText: "Discard",
        UpdateButtonText: "Update",
        CancelEditButtonText: "Cancel",
        TargetDisabledMixedColumn: "Mixed columns are not allowed for this operation",
        TargetDisabledUnknownType: "Type '{0}' is currently an unsupported type",
        TargetDisabledTypeMismatch: "Type '{0}' is not allowed for this operation",
        TargetDisabledTypesNotSame: "All column types must be the same type for this operation",
        CannotSelectTargetReason: "Cannot select target '{0}'. {1}.",
        FormulaExamplesText: "Examples",
        FormulaErrorMessage: "Error: See code panel for details.",
        EditingNotEnabledNotLatest: "Only the most recent operation can be edited."
    };
    /**
     * Localized strings for the cleaning steps panel.
     */
    export const CleaningSteps = {
        DeleteCleaningStepTooltip: "Delete",
        NewOperationPlaceholder: "New operation",
        TargetedColumnsCountLabel: "{0} columns",
        PreviewCodeForAllSteps: "Preview code for all steps"
    };
    /**
     * Localized strings for the code preview panel.
     */
    export const CodePreview = {
        CreatePreviewButtonText: "Preview",
        ApplyPreviewButtonText: "Apply",
        DiscardPreviewButtonText: "Discard",
        UpdateButtonText: "Update",
        CancelEditButtonText: "Cancel",
        NewOperationPlaceholder: "New operation",
        FirstStepLabel: "Imported data",
        ReadOnlyStatusBarSuffix: "- read only",
        PreviewingStatusLabel: "Previewing",
        PreviewUnchangedStatusLabel: "Data is unchanged",
        PreviewUnchangedCustomOperationStatusLabel: "Data is unchanged. Did you forget to modify the variable?",
        CodeGenFailedStatusLabel: "Code generation failed",
        CodeExecutionFailedStatusLabel: "Code execution failed",
        NoOperationStatusLabel: "Choose an operation to generate preview",
        PreviewPausedStatusLabel: "Preview paused",
        MissingArgumentsStatusLabel: "Missing required parameters",
        CodeGeneratedWaitingForExecStatusLabel: "Code generated - manual preview required",
        PreviewingCodeForAllSteps: "Previewing all code steps",
        ShowingCode: "Showing code",
        ReturnToCurrentStepButtonText: "Return to current step"
    };
    /**
     * Localized strings for the summary panel.
     */
    export const Summary = {
        DataFrameShape: "Data shape",
        DataFrameShapeRow: "{0} row",
        DataFrameShapeRowPlural: "{0} rows",
        DataFrameShapeColumn: "{0} column",
        DataFrameShapeColumnPlural: "{0} columns",
        DataFrameNumColumns: "Columns",
        DataFrameNumRowsHeading: "Rows",
        DataFrameNumRowsMissingValue: "Missing values",
        DataFrameNumDuplicateRows: "Duplicate rows",
        DataFrameMissingValuesHeading: "Missing Values (by column)",
        DataFrameNoMissingValue: "No missing values",
        Percentage: "{0}%", // TODO@DW: we may want to revisit this when we make sure localization is working
        MissingData: "--",
        Loading: "Loading...",
        MissingValues: "Missing values",
        DuplicateRows: "Duplicate rows",
        DataType: "Data type",
        DataTypeMixed: "{0} (mixed)",
        UniqueValues: "Unique values",
        StatisticsHeading: "Statistics",
        StatisticsAverage: "Mean",
        StatisticsMedian: "Median",
        StatisticsMin: "Minimum",
        StatisticsMax: "Maximum",
        StatisticsLowerQuartile: "25th percentile",
        StatisticsUpperQuartile: "75th percentile",
        StatisticsStandardDeviation: "Standard deviation",
        StatisticsKurtosis: "Kurtosis",
        StatisticsSkew: "Skew",
        MostFrequentValue: "Most frequent value",
        MostFrequentValueFrequency: "Frequency",
        DataTypeUnsupportedWarning:
            "This data type is not fully supported and will have limited statistics and operations. Please consider changing the column type.",
        DataFrameTruncatedStatisticsWarning:
            "Data was loaded with truncation enabled. Statistics may not reflect the full data."
    };

    /**
     * Localized strings for visualizations.
     */
    export const Visualization = {
        TrueCategoryLabel: "True",
        FalseCategoryLabel: "False",
        RangeFormat: "{0} \u2013 {1}",
        CountLabel: "Count",
        // TODO@DW: localize these within the visualization-highcharts package to allow that to be extracted to its own repository.
        HighchartsNumericVisAriaLabel: "Value histogram",
        HighchartsNumericXAxisAriaLabel: "Bin ranges",
        HighchartsNumericYAxisAriaLabel: "Bin frequencies",
        HighchartsBooleanVisAriaLabel: "Value counts",
        HighchartsBooleanXAxisAriaLabel: "Boolean values",
        HighchartsBooleanYAxisAriaLabel: "Value counts",
        HighchartsXAxisAriaDescription: "The chart has 1 X axis displaying {0}. {1}",
        HighchartsYAxisAriaDescription: "The chart has 1 Y axis displaying {0}. {1}",
        HighchartsDataRangeFromToAriaLabel: "Data ranges from {0} to {1}.",
        HighchartsContainerWithTitleAriaLabel: "{0}. Interactive chart.",
        HighchartsContainerAriaLabel: "Interactive chart.",
        HighchartsSingleColumnSingularAriaLabel: "Bar chart with 1 bar.",
        HighchartsSingleColumnPluralAriaLabel: "Bar chart with {0} bars.",
        HighchartsMultipleBarPluralAriaLabel: "Bar chart with {0} data series.",
        HighchartsEndAriaLabel: "End of interactive chart.",
        HighchartsBarSeriesSummarySingularAriaLabel: "{0}, bar series {1} of {2} with 1 bar.",
        HighchartsBarSeriesSummaryPluralAriaLabel: "{0}, bar series {1} of {2} with {3} bars."
    };
}
