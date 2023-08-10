export function formatPercent(count: number, total: number) {
    // TODO@DW: localize
    const fmt = new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return fmt.format(count / total);
}
