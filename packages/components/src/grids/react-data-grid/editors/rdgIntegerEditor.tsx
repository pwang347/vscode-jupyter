import * as React from "react";
import { IntegerEditorRenderer } from "../../types";
import { renderCustom } from "../../../customRender";

interface IIntegerEditorProps {
    value: number;
    commitEdit: (value: number) => void;
    renderer?: IntegerEditorRenderer;
    gridRowIndex: number;
    gridColumnIndex: number;
    disabled: boolean;
}

/**
 * An integer editor.
 */
export class IntegerEditor extends React.PureComponent<IIntegerEditorProps> {
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
                        type="number"
                        step={1}
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            props.commit(value);
                        }}
                    />
                );
            },
            customRender: renderer
        });
    }
}
