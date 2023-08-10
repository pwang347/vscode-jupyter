let canvas: HTMLCanvasElement | undefined;

function getCanvas(): HTMLCanvasElement {
    if (!canvas) {
        canvas = document.createElement("canvas");
    }
    return canvas;
}

/**
 * Measures the text width.
 */
export function measureText(
    text: string,
    font?: {
        name: string;
        sizeInPx: number;
        weight: number;
    }
): number {
    const context = getCanvas().getContext("2d");
    if (context) {
        if (font) {
            context.font = `${font.weight} ${font.sizeInPx}px ${font.name}`;
        }
        const metrics = context.measureText(text);
        return metrics.width;
    }
    return 0;
}
