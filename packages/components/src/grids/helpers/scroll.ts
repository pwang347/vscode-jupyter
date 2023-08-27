/**
 * Waits for scroll to end.
 * See https://github.com/scroll-into-view/scroll-into-view-if-needed/blob/67e69c49a2e9b19dc6726f26973b12e7caa7be9a/tests/web-platform/css/cssom-view/scrollIntoView-smooth.html#L19
 */
export function waitForScrollEnd(elem: Element) {
    let last_changed_frame = 0;
    let last_x = elem.scrollLeft;
    let last_y = elem.scrollTop;

    return new Promise<void>((resolve) => {
        function tick(frames: number) {
            // We requestAnimationFrame either for 500 frames or until 20 frames with
            // no change have been observed.
            if (frames >= 500 || frames - last_changed_frame > 20) {
                resolve();
            } else {
                if (elem.scrollLeft != last_x || elem.scrollTop != last_y) {
                    last_changed_frame = frames;
                    last_x = elem.scrollLeft;
                    last_y = elem.scrollTop;
                }
                requestAnimationFrame(tick.bind(null, frames + 1));
            }
        }
        tick(0);
    });
}

/**
 * Computes the scroll left to set after a column scroll.
 */
export function getColumnScrollLeft(
    columnIndex: number,
    columnWidths: number[],
    gridScrollWidth: number,
    gridClientWidth: number
) {
    let scrollLeft = 0;
    for (let i = 0; i < Math.min(columnWidths.length, columnIndex); i++) {
        scrollLeft += columnWidths[i];
    }

    // move the column to the middle of the screen and account for half the width of the column we want
    scrollLeft -= gridClientWidth / 2 - columnWidths[columnIndex] / 2;

    // if we went past the first page then reset to 0
    if (scrollLeft < 0) {
        scrollLeft = 0;
    }
    // similarly, if we're at the end we can just use that
    else if (scrollLeft > gridScrollWidth) {
        scrollLeft = gridScrollWidth;
    }
    return scrollLeft;
}
