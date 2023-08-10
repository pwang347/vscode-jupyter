import * as React from "react";

/**
 * Checks if an element has the class that allows it to be focused.
 */
function hasFocusClass(element: Element | null): boolean {
    return Boolean(element?.classList.contains("wrangler-summary-fold-tab-focus"));
}

/**
 * Gets the last focusable child of an element.
 */
function getLastFocusChild(element: Element | null): Element | null {
    const focuses = element?.querySelectorAll(".wrangler-summary-fold-tab-focus");
    if (focuses) {
        const focusesArray = Array.prototype.slice.call(focuses);
        return focusesArray[focusesArray.length - 1];
    }
    return null;
}

/**
 * Gets the first focusable child of an element.
 */
function getFirstFocusChild(element: Element | null): Element | null {
    return element?.querySelector(".wrangler-summary-fold-tab-focus") || null;
}

/**
 * Focuses on the element if it exists and the predicate is true.
 */
function focusIf(element: Element | null, condition: (element: Element | null) => boolean): boolean {
    if (element && condition(element)) {
        (element as HTMLElement).focus();
        return true;
    }
    return false;
}

/**
 * Focuses on the element if it exists.
 */
function focusIfExists(element: Element | null): boolean {
    if (element) {
        (element as HTMLElement).focus();
        return true;
    }
    return false;
}

function handleVerticalArrows(e: React.KeyboardEvent<HTMLDivElement>): boolean {
    if (e.key === "ArrowUp") {
        e.preventDefault();
        return (
            // May go to the previous sibling
            focusIf(e.currentTarget.previousElementSibling, hasFocusClass) ||
            // May go to the parent's previous sibling
            focusIf(e.currentTarget.parentElement!.previousElementSibling, hasFocusClass) ||
            // May go to the parent's previous sibling's last focus child
            focusIfExists(getLastFocusChild(e.currentTarget.parentElement!.previousElementSibling))
        );
    }
    if (e.key === "ArrowDown") {
        e.preventDefault();
        return (
            // May go to the next sibling
            focusIf(e.currentTarget.nextElementSibling, hasFocusClass) ||
            // May go to the next sibling's first focus child
            focusIfExists(getFirstFocusChild(e.currentTarget.nextElementSibling)) ||
            // May go to the parent's next sibling's first focus child
            focusIfExists(getFirstFocusChild(e.currentTarget.parentElement!.nextElementSibling)) ||
            // May go to the parent's next sibling
            focusIf(e.currentTarget.parentElement!.nextElementSibling, hasFocusClass) ||
            // May go to the grandparent's next sibling
            focusIf(e.currentTarget.parentElement!.parentElement!.nextElementSibling, hasFocusClass) ||
            // May go to the grandparent's next sibling's first focus child
            focusIfExists(getFirstFocusChild(e.currentTarget.parentElement!.parentElement!.nextElementSibling))
        );
    }
    return false;
}

export interface IFoldSectionProps {
    title: string;
    secondaryTitle?: string;
    children: React.ReactNode;
    startFolded?: boolean;
}

export interface IFoldSectionState {
    isFolded: boolean;
}

/**
 * A section that can be folded by clicking on the title.
 * It features an anchor at the left of the title to indicate if it is folded or not.
 * The content is visible by default. This behavior can be changed by setting the `startFolded` prop.
 * The header can be focused using tab, up arrow or down arrow keys, and pressing enter will toggle the fold.
 * Left and right arrows toggle the fold.
 */
export class FoldSection extends React.Component<IFoldSectionProps, IFoldSectionState> {
    constructor(props: IFoldSectionProps) {
        super(props);
        this.state = {
            isFolded: props.startFolded ?? false
        };
    }

    private fold = () => {
        this.setState({
            isFolded: !this.state.isFolded
        });
    };

    handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Enter") {
            return this.fold();
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            return this.state.isFolded ? null : this.fold();
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            return this.state.isFolded ? this.fold() : null;
        }
        handleVerticalArrows(e);
    }

    render() {
        return (
            <div className="wrangler-summary-fold-section" style={{ display: "flex", flexDirection: "column" }}>
                <div
                    tabIndex={0}
                    aria-level={1}
                    aria-label={`${this.props.title} ${this.props.secondaryTitle || ""} ${
                        // TODO@DW: localize
                        this.state.isFolded ? "collapsed, press right or enter to expand" : "expanded"
                    }`}
                    onKeyDown={this.handleKeyDown.bind(this)}
                    className="icon wrangler-summary-fold-section-header wrangler-summary-fold-tab-focus"
                    onClick={this.fold}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        cursor: "pointer"
                    }}
                >
                    <h4 className="wrangler-summary-fold-section-title wrangler-secondary-text icon">
                        <i
                            className={`codicon codicon-chevron-${this.state.isFolded ? "right" : "down"}`}
                            aria-hidden="true"
                        ></i>
                        {this.props.title}
                    </h4>
                    {this.props.secondaryTitle ? (
                        <div className="wrangler-secondary-text wrangler-summary-fold-section-secondary-title">
                            {this.props.secondaryTitle}
                        </div>
                    ) : null}
                </div>
                {this.state.isFolded ? null : (
                    <div className="wrangler-summary-fold-section-children">{this.props.children}</div>
                )}
            </div>
        );
    }
}

export interface IFoldSectionItemProps {
    children?: React.ReactNode;
    className?: string;
}

/**
 * A section item that can located using the left and right arrows of the keyboard.
 */
export class FoldSectionItem extends React.Component<IFoldSectionItemProps> {
    render() {
        return (
            <div
                tabIndex={0}
                aria-level={2}
                onKeyDown={handleVerticalArrows}
                className={`wrangler-summary-fold-tab-focus ${this.props.className || ""}`}
            >
                {this.props.children}
            </div>
        );
    }
}
