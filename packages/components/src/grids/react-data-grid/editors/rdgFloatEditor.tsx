import * as React from "react";
import { FloatEditorRenderer } from "../../types";
import { renderCustom } from "../../../customRender";

interface IFloatEditorProps {
    value: number;
    commitEdit: (value: number) => void;
    renderer?: FloatEditorRenderer;
    gridRowIndex: number;
    gridColumnIndex: number;
    disabled: boolean;
}

/**
 * A float editor.
 */
export class FloatEditor extends React.PureComponent<IFloatEditorProps> {
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
                        step={0.1}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            props.commit(value);
                        }}
                    />
                );
            },
            customRender: renderer
        });
    }
}
