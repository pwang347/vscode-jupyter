import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import * as React from "react";

interface IUpdateButtonProps {
    onClick: () => void;
}

interface IUpdateButtonState {
    spinning: boolean;
}

export class UpdateButton extends React.PureComponent<IUpdateButtonProps, IUpdateButtonState> {
    override state: IUpdateButtonState = {
        spinning: false
    };

    public update = () => {
        this.props.onClick();
        this.setState({ spinning: true });
    };

    public reset() {
        this.setState({
            spinning: false
        });
    }

    override render() {
        const { spinning } = this.state;
        const icon = spinning ? "codicon-loading codicon-modifier-spin" : "codicon-hubot";
        return (
            <VSCodeButton style={{ marginTop: 4 }} appearance="primary" onClick={this.update} disabled={spinning}>
                Generate code
                <span slot="start" className={`codicon ${icon}`}></span>
            </VSCodeButton>
        );
    }
}
