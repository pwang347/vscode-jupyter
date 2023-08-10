import * as React from "react";
import { DateTimeEditorRenderer } from "../../types";
import { renderCustom } from "../../../customRender";

interface IDateTimeEditorProps {
    value: Date;
    commitEdit: (value: Date) => void;
    renderer?: DateTimeEditorRenderer;
    gridRowIndex: number;
    gridColumnIndex: number;
    disabled: boolean;
}

/**
 * A date time editor.
 */
export class DateTimeEditor extends React.PureComponent<IDateTimeEditorProps> {
    render() {
        const { value, commitEdit, renderer, gridRowIndex, gridColumnIndex, disabled } = this.props;
        return renderCustom({
            props: {
                disabled,
                value,
                commit: commitEdit,
                gridRowIndex,
                gridColumnIndex
            },
            defaultRender: (props) => {
                return (
                    <input
                        disabled={disabled}
                        type="date"
                        defaultValue={props.value.toISOString()}
                        onChange={(e) => {
                            props.commit(new Date(e.target.value));
                        }}
                    />
                );
            },
            customRender: renderer
        });
    }
}
