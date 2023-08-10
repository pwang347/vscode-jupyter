import * as React from "react";
import { BooleanEditorRenderer } from "../../types";
import { renderCustom } from "../../../customRender";

interface IBooleanEditorProps {
    value: boolean;
    commitEdit: (value: boolean) => void;
    renderer?: BooleanEditorRenderer;
    gridRowIndex: number;
    gridColumnIndex: number;
    disabled: boolean;
}

/**
 * A boolean editor.
 */
export class BooleanEditor extends React.PureComponent<IBooleanEditorProps> {
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
                        type={"checkbox"}
                        defaultChecked={props.value}
                        onChange={(e) => {
                            const value = e.target.checked;
                            props.commit(value);
                        }}
                    />
                );
            },
            customRender: renderer
        });
    }
}
