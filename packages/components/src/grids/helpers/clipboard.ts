/**
 * Copies the given text into the clipboard.
 * Returns true if successful and false otherwise.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
    // we should silently fail if unable to access the clipboard
    try {
        // most modern browsers should support this API, but if not we should use a fallback
        if (!navigator.clipboard) {
            return fallbackCopyTextToClipboard(text);
        }

        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // we can get an error if we lack permissions
        return false;
    }
}

function fallbackCopyTextToClipboard(text: string): boolean {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand("copy");
        return true;
    } catch (err) {
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}
