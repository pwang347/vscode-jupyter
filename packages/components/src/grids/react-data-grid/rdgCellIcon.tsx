import * as React from "react";
import { renderCustom } from "../../customRender";
import { LocalizedStrings } from "../../localization";
import { GridCellIcon, ICellRenderers } from "../types";

interface IReactDataGridCellIconProps {
    isCellEditable: boolean;
    isCellEdited: boolean;
    isSignificantInputCell: boolean;
    isEditStagedForCell: boolean;
    isDisplayedDueToError: boolean;
    localizedStrings: typeof LocalizedStrings.Grid;
    renderers?: ICellRenderers;
}

/**
 * Icon for a data grid cell.
 */
export class ReactDataGridCellIcon extends React.PureComponent<IReactDataGridCellIconProps> {
    render() {
        const {
            isCellEditable,
            isCellEdited,
            isSignificantInputCell,
            isEditStagedForCell,
            isDisplayedDueToError,
            localizedStrings,
            renderers
        } = this.props;

        // don't bother rendering the container if the cell isn't editable
        if (!isCellEditable) {
            return null;
        }

        const iconType = isCellEdited
            ? isEditStagedForCell && isDisplayedDueToError
                ? GridCellIcon.EditFail
                : GridCellIcon.EditSuccess
            : isSignificantInputCell
            ? GridCellIcon.EditSuggested
            : undefined;

        return (
            <React.Fragment>
                <span className="wrangler-cell-icon">
                    {iconType &&
                        renderCustom({
                            props: {
                                cellIcon: iconType,
                                iconTooltipText:
                                    iconType === GridCellIcon.EditSuccess
                                        ? localizedStrings.CellIconEditSuccess
                                        : iconType === GridCellIcon.EditFail
                                        ? localizedStrings.CellIconEditFailed
                                        : localizedStrings.CellIconEditSuggested
                            },
                            defaultRender: () => null,
                            customRender: renderers?.onRenderCellIcon
                        })}
                </span>
                <span className="wrangler-cell-icon-spacer" />
            </React.Fragment>
        );
    }
}
