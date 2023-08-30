import { IDatetimeFieldProps } from "@dw/components/dist/panels/operations/types";
import { formatString } from "@dw/messaging";
import { DatePicker, TimePicker, TextField, Label } from "@fluentui/react";
import * as React from "react";

import "./dateTimePicker.css";

interface IDateTimePickerProps extends Omit<IDatetimeFieldProps, "disabled"> {
    locStrings: {
        dateTimePickerInvalidDateTimeFormatMessage: string;
    };
    customFormatter?: {
        formatDisplay: (date: Date) => string;
        parseDate: (dateString: string) => Date;
    };
    disabled?: boolean;
}

interface IDateTimePickerState {
    dateTimeString?: string;
    errorMessage?: string;
}

/**
 * Given a UTC date, convert it to the same value but in local time.
 * This is useful because most Fluent displays only use local time.
 */
function convertToUtcDateInCurrentTimezoneOffset(date: Date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

// since TimePicker only supports having a default value (and not a live value), we should just
// start the choices from midnight for simplicity
const timePickerDummyDate = convertToUtcDateInCurrentTimezoneOffset(new Date("2022-01-01T00:00:00.000Z"));

export class DateTimePicker extends React.Component<IDateTimePickerProps, IDateTimePickerState> {
    constructor(props: IDateTimePickerProps) {
        super(props);
        this.state = {
            dateTimeString: props.value
        };
    }

    formatDateToString(date: Date) {
        const { customFormatter } = this.props;
        return customFormatter ? customFormatter.formatDisplay(date) : date.toISOString();
    }

    formatStringToDate(dateString: string) {
        const { customFormatter } = this.props;
        return customFormatter ? customFormatter.parseDate(dateString) : new Date(dateString);
    }

    override componentDidUpdate(prevProps: IDateTimePickerProps) {
        const { value } = this.props;
        // handle external value updates
        if (prevProps.value !== value && value !== this.state.dateTimeString) {
            this.setState({
                dateTimeString: value,
                errorMessage: undefined
            });
        }
    }

    override render() {
        const { value, minValue, maxValue, onChange, locStrings, disabled } = this.props;
        const { dateTimeString, errorMessage } = this.state;
        return (
            <div className="wrangler-date-time-picker">
                <Label>{this.props.label}</Label>
                <div style={{ display: "flex" }}>
                    <TextField
                        styles={{ root: { flexGrow: 1 } }}
                        value={dateTimeString}
                        errorMessage={errorMessage}
                        disabled={disabled}
                        onChange={(_, newValue) => {
                            if (newValue) {
                                try {
                                    // a valid conversion needs to be the bidirectional
                                    const tryParseDate = this.formatStringToDate(newValue);
                                    if (this.formatDateToString(tryParseDate) === newValue) {
                                        this.setState({
                                            dateTimeString: newValue,
                                            errorMessage: undefined
                                        });
                                        onChange(newValue);
                                        return;
                                    }
                                } catch (e) {
                                    // failed to parse
                                    this.setState({
                                        dateTimeString: newValue,
                                        errorMessage: formatString(
                                            locStrings.dateTimePickerInvalidDateTimeFormatMessage,
                                            newValue
                                        )
                                    });
                                }
                            }
                        }}
                    />
                    {/* TODO@DW: localize? */}
                    <DatePicker
                        value={convertToUtcDateInCurrentTimezoneOffset(new Date(value))}
                        minDate={minValue ? convertToUtcDateInCurrentTimezoneOffset(new Date(minValue)) : undefined}
                        maxDate={maxValue ? convertToUtcDateInCurrentTimezoneOffset(new Date(maxValue)) : undefined}
                        styles={{
                            icon: { position: "unset", right: "unset" },
                            readOnlyTextField: { display: "none" },
                            root: { width: "fit-content" }
                        }}
                        disabled={disabled}
                        onSelectDate={(d) => {
                            if (d) {
                                const currentDate = new Date(value);
                                currentDate.setUTCFullYear(d.getFullYear());
                                currentDate.setUTCMonth(d.getMonth());
                                currentDate.setUTCDate(d.getDate());
                                const dateTimeString = this.formatDateToString(currentDate);
                                this.setState({
                                    dateTimeString,
                                    errorMessage: undefined
                                });
                                onChange(dateTimeString);
                            }
                        }}
                    />
                    {/* TODO@DW: localize? */}
                    <TimePicker
                        useHour12={true}
                        showSeconds={true}
                        defaultValue={timePickerDummyDate}
                        iconButtonProps={{
                            iconProps: { iconName: "Clock" },
                            style: {
                                width: "fit-content"
                            }
                        }}
                        styles={{
                            input: { display: "none" },
                            root: { paddingLeft: 0 },
                        }}
                        calloutProps={{
                            className: "timepicker"
                        }}
                        disabled={disabled}
                        // TODO@DW: localize
                        onFormatDate={(date) => {
                            return date.toLocaleString("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                                second: "numeric",
                                hour12: true
                            });
                        }}
                        onChange={(_, time) => {
                            if (time) {
                                const currentDate = new Date(value);
                                currentDate.setUTCHours(time.getHours());
                                currentDate.setUTCMinutes(time.getMinutes());
                                currentDate.setUTCSeconds(time.getSeconds());
                                currentDate.setUTCMilliseconds(time.getMilliseconds());
                                const dateTimeString = this.formatDateToString(currentDate);
                                this.setState({
                                    dateTimeString,
                                    errorMessage: undefined
                                });
                                onChange(dateTimeString);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }
}
