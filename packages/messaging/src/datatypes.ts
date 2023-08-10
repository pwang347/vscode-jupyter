/**
 * All supported column types. These types are native to the current package and are not tied to particular engines.
 * In general, this should stay as a superset of column types from all supported engines.
 */
export enum ColumnType {
    String = "string",
    Integer = "integer",
    Float = "float",
    Complex = "complex",
    Boolean = "boolean",
    Datetime = "datetime",
    Timedelta = "timedelta",
    Period = "period",
    Interval = "interval",
    Category = "category",

    // add a catch-all type so that we can handle new/unexpected types gracefully
    Unknown = "unknown"
}

/**
 * Metadata associated with a column type.
 */
export interface IColumnTypeMetadataMapping {
    [ColumnType.String]: {};
    [ColumnType.Integer]: {
        unsigned?: boolean;
        bits?: 8 | 16 | 32 | 64;
    };
    [ColumnType.Float]: {
        bits?: 16 | 32 | 64;
    };
    [ColumnType.Complex]: {};
    [ColumnType.Boolean]: {};
    [ColumnType.Datetime]: {};
    [ColumnType.Timedelta]: {};
    [ColumnType.Period]: {};
    [ColumnType.Interval]: {};
    [ColumnType.Category]: {};
    [ColumnType.Unknown]: {};
}
