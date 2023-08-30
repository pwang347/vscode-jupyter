import { IStringFieldProps } from "@dw/components/dist/panels/operations/types";
import { ITextField, TextField } from "@fluentui/react";
import * as React from "react";
import { UpdateButton } from "./updateButton";

interface IStringFieldComponentProps extends IStringFieldProps {
    updateButtonRef: React.RefObject<UpdateButton>;
}

interface IStringFieldState {
    value: string;
}

/**
 * A string field in an operation form.
 */
export class StringField extends React.PureComponent<IStringFieldComponentProps, IStringFieldState> {
    private ref = React.createRef<ITextField>();

    override state: IStringFieldState = {
        value: ""
    };

    override componentDidMount() {
        if (this.props.focusOnMount) {
            this.ref.current?.focus();
        }
        if (this.state.value !== this.props.value) {
            this.setState({
                value: this.props.value
            });
        }
    }

    private onChange = (_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string | undefined) => {
        if (this.props.usePreviewButton) {
            this.setState({
                value: newValue ?? ""
            });
        } else {
            this.props.onChange(newValue ?? "");
        }
    };

    override render() {
        return (
            <>
                <TextField
                    componentRef={this.ref}
                    label={this.props.label}
                    // if we have a preview button, then we should track the value as component
                    // state instead of being controlled by the passed props
                    value={this.props.usePreviewButton ? this.state.value : this.props.value}
                    disabled={this.props.disabled}
                    onKeyDown={(e) => {
                        // TODO@DW: verify that we want to use Ctrl+Enter
                        if (e.ctrlKey && e.key === "Enter") {
                            this.props.updateButtonRef.current?.update();
                        }
                    }}
                    onChange={this.onChange}
                    multiline={this.props.multiline}
                    placeholder={this.props.placeholder}
                    autoAdjustHeight={this.props.multiline}
                />
                {this.props.usePreviewButton && (
                    <UpdateButton
                        ref={this.props.updateButtonRef}
                        onClick={() => {
                            this.props.onChange(this.state.value);
                        }}
                    />
                )}
            </>
        );
    }
}
