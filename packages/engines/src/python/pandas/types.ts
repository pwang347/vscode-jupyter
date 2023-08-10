/** All supported Pandas dtypes */
export enum PandasDTypes {
    Object = "object",
    String = "string",
    DateTime64 = "datetime64[ns]",
    TimeDelta64 = "timedelta64[ns]",
    Category = "category",
    ///////////////////////////////////////////
    // numpy floating dtype
    Float16 = "float16",
    Float32 = "float32",
    Float64 = "float64",
    ///////////////////////////////////////////
    // numpy integer dtype
    Int8 = "int8",
    Int16 = "int16",
    Int32 = "int32",
    Int64 = "int64",
    UInt8 = "uint8",
    UInt16 = "uint16",
    UInt32 = "uint32",
    UInt64 = "uint64",
    ///////////////////////////////////////////
    // numpy boolean dtype
    Bool = "bool"
}

/**
 * Python package installers.
 */
export enum PythonPackageInstallers {
    Pip = "pip",
    Conda = "conda",
    Micropip = "micropip"
}
