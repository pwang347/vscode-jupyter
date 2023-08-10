import * as React from "react";
import { TextEditorRenderer } from "../../types";
import { renderCustom } from "../../../customRender";
import { LocalizedStrings } from "../../../localization";

interface ITextEditorProps {
    value: string;
    commitEdit: (value: string, force?: boolean) => void;
    renderer?: TextEditorRenderer;
    gridRowIndex: number;
    gridColumnIndex: number;
    localizedStrings: typeof LocalizedStrings.Grid;
    disabled: boolean;
}

/**
 * A text editor.
 */
export class TextEditor extends React.PureComponent<ITextEditorProps> {
    private inputRef = React.createRef<HTMLInputElement>();

    componentDidMount() {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
            this.inputRef.current.select();
        }
    }

    render() {
        const { value, commitEdit, renderer, gridRowIndex, gridColumnIndex, localizedStrings, disabled } = this.props;
        return renderCustom({
            props: {
                disabled,
                value,
                placeholder: localizedStrings.CellEditPlaceholder,
                commit: commitEdit,
                gridRowIndex,
                gridColumnIndex
            },
            defaultRender: (props) => {
                return (
                    <input
                        disabled={disabled}
                        ref={this.inputRef}
                        className="editor-text"
                        defaultValue={props.value}
                        placeholder={props.placeholder}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const value = (e.target as any).value;
                                props.commit(value, true);
                            }
                        }}
                        onBlur={(e) => {
                            const value = e.target.value;
                            props.commit(value);
                        }}
                    />
                );
            },
            customRender: renderer
        });
    }
}
