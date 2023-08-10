import { IOperationView } from "@dw/messaging";
import * as React from "react";
import { renderCustom } from "../../customRender";
import { LocalizedStrings } from "../../localization";
import { IOperationGroup, IOperationsPanelListViewRenderers } from "./types";

/**
 * Props for the operations list view.
 */
export interface IOperationsListViewProps {
    operations: IOperationView[];
    renderers?: IOperationsPanelListViewRenderers;
    updateOperation: (operation: IOperationView) => void;
    searchValue: string;
    setSearchValue: (value: string) => void;
    locStrings: typeof LocalizedStrings.Operations;
}

/**
 * List of operations to be displayed.
 */
export class OperationsListView extends React.PureComponent<IOperationsListViewProps> {
    private filterOperation(operation: IOperationView) {
        const { searchValue } = this.props;
        if (!searchValue) {
            return true;
        }
        const searchValueInLowercase = searchValue.toLocaleLowerCase();
        return (
            operation.name.toLocaleLowerCase().includes(searchValueInLowercase) ||
            operation.helpText.toLocaleLowerCase().includes(searchValueInLowercase)
        );
    }

    /**
     * Renders a list of operation groups.
     */
    private renderOperationGroupList() {
        const { operations, renderers, updateOperation } = this.props;
        const groupsMapping: { [key: string]: IOperationGroup } = {};
        const groups: IOperationGroup[] = [];
        const topLevelOperationViews: IOperationView[] = [];
        for (const operation of operations) {
            if (!operation.category) {
                topLevelOperationViews.push(operation);
                continue;
            }
            if (!(operation.category in groupsMapping)) {
                const group = {
                    label: operation.category,
                    operations: [operation]
                };
                groupsMapping[operation.category] = group;
                groups.push(group);
            } else {
                groupsMapping[operation.category].operations.push(operation);
            }
        }
        return renderCustom({
            props: {
                groups: groups
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((group) => ({
                        groupLabel: group.label,
                        operations: group.operations.map((operation) => ({
                            label: operation.name,
                            key: operation.key,
                            onClick: () => {
                                updateOperation(operation);
                            }
                        }))
                    })),
                topLevelOperations: topLevelOperationViews
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((operation) => ({
                        label: operation.name,
                        key: operation.key,
                        onClick: () => {
                            updateOperation(operation);
                        }
                    }))
            },
            defaultRender: (props) => (
                <div>
                    {props.groups.map((group) => {
                        return (
                            <div key={group.groupLabel}>
                                <h2>{group.groupLabel}</h2>
                                {group.operations.map((operation) => {
                                    return (
                                        <div key={operation.key} onClick={operation.onClick}>
                                            {operation.label}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            ),
            customRender: renderers?.onRenderOperationGroupList
        });
    }

    /**
     * Renders a flat list of operations.
     */
    private renderOperationList() {
        const { operations, updateOperation, renderers } = this.props;
        const filteredOperations = operations.filter((operation) => this.filterOperation(operation));
        if (filteredOperations.length === 0) {
            return null;
        }
        return (
            <div className="wrangler-operation-list-content">
                {renderCustom({
                    props: {
                        operations: filteredOperations.map((operation) => ({
                            label: operation.name,
                            key: operation.key,
                            onClick: () => {
                                updateOperation(operation);
                            }
                        }))
                    },
                    defaultRender: (props) => (
                        <div>
                            {props.operations.map((operation) => {
                                return (
                                    <div key={operation.key} onClick={operation.onClick}>
                                        {operation.label}
                                    </div>
                                );
                            })}
                        </div>
                    ),
                    customRender: renderers?.onRenderOperationList
                })}
            </div>
        );
    }

    /**
     * Renders the search bar.
     */
    private renderSearchBar() {
        const { operations, renderers, searchValue, setSearchValue, locStrings } = this.props;
        return renderCustom({
            props: {
                value: searchValue,
                placeholder: locStrings.SearchForOperationsPlaceholder,
                disabled: operations.length === 0,
                onChange: (value) => {
                    setSearchValue(value);
                }
            },
            defaultRender: (props) => (
                <input
                    type="text"
                    value={props.value}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                    onChange={(e) => {
                        props.onChange(e.target.value);
                    }}
                />
            ),
            customRender: renderers?.onRenderOperationSearch
        });
    }

    render() {
        const { searchValue } = this.props;
        return (
            <div className="operation-panel-list-view">
                <div className="operation-panel-search-container">{this.renderSearchBar()}</div>
                <div className="operation-panel-operation-list-container">
                    {searchValue ? this.renderOperationList() : this.renderOperationGroupList()}
                </div>
            </div>
        );
    }
}
