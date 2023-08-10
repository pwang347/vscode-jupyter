/**
 * All supported PySpark dtypes.
 * See https://spark.apache.org/docs/latest/api/python/user_guide/pandas_on_spark/types.html
 *
 * TODO@DW: expand this to more than just the subset supported on Pandas.
 */
export enum PySparkDTypes {
    String = "StringType",
    Timestamp = "TimestampType",
    Float = "FloatType",
    Double = "DoubleType",
    Byte = "ByteType",
    Short = "ShortType",
    Integer = "IntegerType",
    Long = "LongType",
    Boolean = "BooleanType"
}
