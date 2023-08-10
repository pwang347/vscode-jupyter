import * as React from "react";
import { render, fireEvent } from "@testing-library/react";
import { FoldSection, FoldSectionItem } from "./foldSection";

const foldSectionSelector = ".wrangler-summary-fold-section";
const foldSectionHeaderSelector = ".wrangler-summary-fold-section-header";
const foldSectionTitleSelector = ".wrangler-summary-fold-section-title";
const foldSectionSecondaryTitleSelector = ".wrangler-summary-fold-section-secondary-title";
const foldSectionChildrenSelector = ".wrangler-summary-fold-section-children";
const foldSectionTabFocusSelector = ".wrangler-summary-fold-tab-focus";
const enterKey = { key: "Enter", code: "Enter", charCode: 13 };
const leftKey = { key: "ArrowLeft", code: "ArrowLeft", charCode: 37 };
const rightKey = { key: "ArrowRight", code: "ArrowRight", charCode: 39 };
const upKey = { key: "ArrowUp", code: "ArrowUp", charCode: 38 };
const downKey = { key: "ArrowDown", code: "ArrowDown", charCode: 40 };

describe("<FoldSection>", () => {
    it("should accept title, secondaryTitle and children", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        const title = foldSection?.querySelector(foldSectionTitleSelector);
        expect(title?.textContent).toBe("Title");

        const secondaryTitle = foldSection?.querySelector(foldSectionSecondaryTitleSelector);
        expect(secondaryTitle?.textContent).toBe("Secondary Title");

        const children = foldSection?.querySelector(foldSectionChildrenSelector);
        expect(children?.textContent).toBe("Content");
    });

    it("Clicking the title should toggle the rendering of the children", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        const title = foldSection?.querySelector(foldSectionTitleSelector);
        expect(title?.textContent).toBe("Title");

        const secondaryTitle = foldSection?.querySelector(foldSectionSecondaryTitleSelector);
        expect(secondaryTitle?.textContent).toBe("Secondary Title");

        const children = foldSection?.querySelector(foldSectionChildrenSelector);
        expect(children?.textContent).toBe("Content");

        fireEvent.click(title!);
        expect(foldSection?.textContent).toBe("TitleSecondary Title");

        fireEvent.click(title!);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
    });

    it("The title chevron should point to the bottom when open, to the right when closed", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        const title = foldSection?.querySelector(foldSectionTitleSelector);
        const icon = title?.querySelector(".codicon");

        expect(icon?.classList.contains("codicon-chevron-down"));
        fireEvent.click(title!);
        expect(icon?.classList.contains("codicon-chevron-right"));
        fireEvent.click(title!);
        expect(icon?.classList.contains("codicon-chevron-down"));
        fireEvent.click(title!);
        expect(icon?.classList.contains("codicon-chevron-right"));
    });

    it("Focusing on a FoldSection's header, then pressing 'Enter' should toggle the rendering of the children", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Enter" while the header is not focused should have no effect.
        fireEvent.keyDown(foldSection!, enterKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
        fireEvent.keyDown(foldSection!, enterKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Enter" while the header is focused should toggle the rendering of the children.
        const header = foldSection?.querySelector(foldSectionHeaderSelector);
        fireEvent.focus(header!);
        fireEvent.keyDown(header!, enterKey);
        expect(foldSection?.textContent).toBe("TitleSecondary Title");
        fireEvent.keyDown(header!, enterKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
    });

    it("Focusing on a FoldSection's header, then pressing 'Left' should hide the children", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Left" while the header is not focused should have no effect.
        fireEvent.keyDown(foldSection!, leftKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
        fireEvent.keyDown(foldSection!, leftKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Left" while the header is focused should hide the children.
        const header = foldSection?.querySelector(foldSectionHeaderSelector);
        fireEvent.focus(header!);
        fireEvent.keyDown(header!, leftKey);
        expect(foldSection?.textContent).toBe("TitleSecondary Title");

        // Pressing "Left" again should have no effect.
        fireEvent.keyDown(header!, leftKey);
        expect(foldSection?.textContent).toBe("TitleSecondary Title");
    });

    it("Focusing on the header of a FoldSection with hidden children, then pressing 'Right' should show the children", () => {
        render(
            <FoldSection title="Title" secondaryTitle="Secondary Title">
                Content
            </FoldSection>
        );

        const foldSection = document.querySelector(foldSectionSelector);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Right" while the header is not focused should have no effect.
        fireEvent.keyDown(foldSection!, rightKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
        fireEvent.keyDown(foldSection!, rightKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Right" when the FoldSection is not folded should have no effect.
        const header = foldSection?.querySelector(foldSectionHeaderSelector);
        fireEvent.keyDown(header!, rightKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Left" while the header is focused should hide the children.
        fireEvent.focus(header!);
        fireEvent.keyDown(header!, leftKey);
        expect(foldSection?.textContent).toBe("TitleSecondary Title");

        // Pressing "Right" while the header is focused should hide the children.
        fireEvent.keyDown(header!, rightKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");

        // Pressing "Left" again should have no effect.
        fireEvent.keyDown(header!, rightKey);
        expect(foldSection?.textContent).toBe("TitleSecondary TitleContent");
    });

    it("Pressing 'Down' while focusing on the header of a FoldSection should focus the next FoldSection, if any", () => {
        render(
            <div>
                <FoldSection title="Title" secondaryTitle="Secondary Title">
                    Content
                </FoldSection>
                <FoldSection title="Title 2" secondaryTitle="Secondary Title 2">
                    Content 2
                </FoldSection>
            </div>
        );

        const headers = Array.prototype.slice.call(
            document.querySelectorAll(foldSectionHeaderSelector)
        ) as HTMLElement[];

        // Pressing "Down" while the header is focused should focus the next FoldSection.
        fireEvent.focus(headers[0]!);
        fireEvent.keyDown(headers[0]!, downKey);
        expect(document.activeElement === headers[1]!);

        // Pressing "Down" while the last header is focused should have no effect.
        fireEvent.keyDown(headers[1]!, downKey);
        expect(document.activeElement === headers[1]!);
    });

    it("Pressing 'Up' while focusing on the header of a FoldSection should focus the next FoldSection, if any", () => {
        render(
            <div>
                <FoldSection title="Title" secondaryTitle="Secondary Title">
                    Content
                </FoldSection>
                <FoldSection title="Title 2" secondaryTitle="Secondary Title 2">
                    Content 2
                </FoldSection>
            </div>
        );

        const headers = Array.prototype.slice.call(
            document.querySelectorAll(foldSectionHeaderSelector)
        ) as HTMLElement[];

        // Pressing "Up" while the header is focused should focus the next FoldSection.
        fireEvent.focus(headers[1]!);
        fireEvent.keyDown(headers[1]!, upKey);
        expect(document.activeElement === headers[0]!);

        // Pressing "Up" while the last header is focused should have no effect.
        fireEvent.keyDown(headers[0]!, upKey);
        expect(document.activeElement === headers[0]!);
    });

    it("Pressing 'Down' should navigate through items and headers", () => {
        render(
            <div>
                <FoldSectionItem>Content 1</FoldSectionItem>
                <FoldSection title="Title" secondaryTitle="Secondary Title">
                    <FoldSectionItem>Content 2</FoldSectionItem>
                    <FoldSectionItem>Content 3</FoldSectionItem>
                </FoldSection>
                <FoldSection title="Title 2" secondaryTitle="Secondary Title 2">
                    <FoldSectionItem>Content 4</FoldSectionItem>
                </FoldSection>
            </div>
        );

        const tabFocuses = Array.prototype.slice.call(
            document.querySelectorAll(foldSectionTabFocusSelector)
        ) as HTMLElement[];

        fireEvent.focus(tabFocuses[0]!);

        // Pressing "Down" while the header is focused should focus the next FoldSection.
        for (let i = 0; i < tabFocuses.length - 1; i++) {
            fireEvent.keyDown(tabFocuses[i]!, downKey);
            expect(document.activeElement === tabFocuses[i + 1]!);
        }
    });

    it("Pressing 'Up' should navigate through items and headers", () => {
        render(
            <div>
                <FoldSectionItem>Content 1</FoldSectionItem>
                <FoldSection title="Title" secondaryTitle="Secondary Title">
                    <FoldSectionItem>Content 2</FoldSectionItem>
                    <FoldSectionItem>Content 3</FoldSectionItem>
                </FoldSection>
                <FoldSection title="Title 2" secondaryTitle="Secondary Title 2">
                    <FoldSectionItem>Content 4</FoldSectionItem>
                </FoldSection>
            </div>
        );

        let tabFocuses = Array.prototype.slice.call(
            document.querySelectorAll(foldSectionTabFocusSelector)
        ) as HTMLElement[];

        // Going backwards.
        tabFocuses = tabFocuses.reverse();
        fireEvent.focus(tabFocuses[0]!);

        // Pressing "Up" while the header is focused should focus the next FoldSection.
        for (let i = 0; i < tabFocuses.length - 1; i++) {
            fireEvent.keyDown(tabFocuses[i]!, upKey);
            expect(document.activeElement === tabFocuses[i + 1]!);
        }
    });
});
