/**
 * Render function.
 */
export type IRenderFunction<P, TReturn = JSX.Element> = (
    props: P,
    defaultRender: (props: P) => TReturn | null
) => TReturn | null;

/**
 * Given a props object, renders using a custom renderer. If the custom renderer doesn't exist, then uses the default
 * renderer.
 *
 * TODO@DW: check profiler to see if we need to return a memoized function here or offer it as an alternative
 */
export function renderCustom<
    TProps,
    TRender extends (props: TProps) => TReturn | null,
    TReturn = JSX.Element
>(customRenderParams: {
    props: TProps;
    defaultRender: TRender;
    customRender?: (props: TProps, defaultRender: TRender) => TReturn | null;
}) {
    const { props, defaultRender, customRender } = customRenderParams;
    const rendered = customRender ? customRender(props, defaultRender) : defaultRender(props);
    return rendered;
}
