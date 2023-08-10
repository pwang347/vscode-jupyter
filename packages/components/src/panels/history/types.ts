/**
 * The status of the preview.
 */
export enum PreviewStatus {
    NoOperation = "NoOperation",
    Previewing = "Previewing",
    PreviewUnchanged = "PreviewUnchanged",
    PreviewUnchangedCustomOperation = "PreviewUnchangedCustomOperation",
    PreviewPaused = "PreviewPaused",
    CodeGenFailed = "CodeGenFailed",
    CodeExecFailed = "CodeExecFailed",
    MissingArguments = "MissingArguments",
    CodeGeneratedWaitingForExec = "CodeGeneratedWaitingForExec"
}
