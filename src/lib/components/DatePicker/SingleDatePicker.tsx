import React from "react";
import BaseDatePicker, { BaseDatePickerProps } from "./BaseDatePicker";
import { ClientOnly } from "./ClientOnly";

export interface SingleDatePickerProps
  extends Omit<BaseDatePickerProps, "onChange"> {
  startDate: Date | null;
  startDatePlaceholder?: string;
  onChange?: (date: Date | null) => void;
  onCloseCalendar?: (date: Date | null) => void;
  singleCalendar?: boolean;
}

export const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  onChange = () => {},
  onCloseCalendar = () => {},
  startDatePlaceholder = "Date",
  ...props
}) => (
  <ClientOnly>
    <BaseDatePicker
      {...props}
      endDate={null}
      isSingle={true}
      startDate={props.startDate}
      startDatePlaceholder={startDatePlaceholder}
      onChange={(date) => onChange(date)}
      onCloseCalendar={(date) => onCloseCalendar(date)}
    />
  </ClientOnly>
);
