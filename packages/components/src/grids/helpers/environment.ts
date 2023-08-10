/**
 * Whether device hosting the browser is Apple product or not.
 */
export function isAppleProduct(): boolean {
    // https://stackoverflow.com/questions/10527983/best-way-to-detect-mac-os-x-or-windows-computers-with-javascript-or-jquery
    return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}
