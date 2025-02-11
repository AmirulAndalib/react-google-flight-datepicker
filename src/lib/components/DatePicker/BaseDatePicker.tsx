import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import cx from "classnames";
import localeData from "dayjs/plugin/localeData";
import { debounce } from "../../helpers";

import { DateInputGroup } from "./DateInputGroup";
import DialogWrapper from "./DialogWrapper";
import { Dialog } from "./Dialog";

import {
  DatePickerConfig,
  DatePickerProvider,
  DateState,
  DisplayCustomization,
  UIState,
} from "./DatePickerProvider";
import { useClientSide } from "@lib/hooks/useClientSide";

dayjs.extend(localeData);

export interface SubTextDict {
  [key: string]: string;
}

// Base shared props
export interface BaseDatePickerProps {
  className?: string;
  disabled?: boolean;
  startWeekDay?: "monday" | "sunday";
  minDate?: Date | null;
  maxDate?: Date | null;
  weekDayFormat?: string;
  dateFormat?: string;
  monthFormat?: string;
  highlightToday?: boolean;
  isOpen?: boolean;
  tooltip?: string | React.ReactNode | ((date: Date) => React.ReactNode);
  subTextDict?: SubTextDict | null;
  expandDirection?: string;
  locale?: string;
  onFocus?: (input: string) => void;
}

// Internal props for the base component
interface BaseDatePickerInternalProps extends BaseDatePickerProps {
  isSingle: boolean;
  startDate: Date | null;
  endDate: Date | null;
  startDatePlaceholder: string;
  endDatePlaceholder?: string;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  onCloseCalendar: (startDate: Date | null, endDate: Date | null) => void;
  dateInputSeperator?: React.ReactNode;
  hideDialogHeader?: boolean;
  hideDialogFooter?: boolean;
  hideDialogAfterSelectEndDate?: boolean;
  singleCalendar?: boolean;
}

const BaseDatePicker: React.FC<BaseDatePickerInternalProps> = ({
  startDate = null,
  endDate = null,
  className = "",
  disabled = false,
  startDatePlaceholder,
  endDatePlaceholder,
  onChange,
  onFocus = () => {},
  startWeekDay = "monday",
  minDate = null,
  maxDate = null,
  weekDayFormat = "dd",
  dateFormat = "",
  monthFormat = "",
  highlightToday = false,
  dateInputSeperator = null,
  hideDialogHeader = false,
  hideDialogFooter = false,
  hideDialogAfterSelectEndDate = false,
  isOpen = false,
  onCloseCalendar,
  tooltip = "",
  subTextDict = null,
  expandDirection = "right",
  locale = "en",
  isSingle = false,
  singleCalendar = false,
}) => {
  // State
  const [complsOpen, setComplsOpen] = useState<boolean>(isOpen);
  const [inputFocus, setInputFocus] = useState<"from" | "to" | null>(
    isSingle ? "from" : null
  );
  const [fromDate, setFromDate] = useState<Dayjs | undefined>(
    startDate ? dayjs(startDate) : undefined
  );
  const [toDate, setToDate] = useState<Dayjs | undefined>(
    endDate ? dayjs(endDate) : undefined
  );
  const [hoverDate, setHoverDate] = useState<Dayjs | undefined>();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);


  const isClient = useClientSide();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fromDateRef = useRef<Dayjs | null>(null);
  const toDateRef = useRef<Dayjs | null>(null);

  // Handle resize for mobile detection
  const handleResize = useCallback((): void => {
    if (!isClient) return;
    setIsMobile(window.innerWidth < 768);
  }, [isClient]);

  // Notify change handlers
  const notifyChange = (): void => {
    const _startDate = fromDateRef.current
      ? fromDateRef.current.toDate()
      : null;
    const _endDate =
      !isSingle && toDateRef.current ? toDateRef.current.toDate() : null;

    if (isSingle) {
      onChange(_startDate, null);
    } else {
      onChange(_startDate, _endDate);
    }
  };

  const debounceNotifyChange = debounce(notifyChange, 20);

  // Update date handlers
  const updateFromDate = (
    dateValue: Dayjs | null | undefined,
    shouldNotifyChange = false
  ): void => {
    setFromDate(dateValue || undefined);
    fromDateRef.current = dateValue || null;
    if (shouldNotifyChange) {
      debounceNotifyChange();
    }
  };

  const updateToDate = (
    dateValue: Dayjs | null | undefined,
    shouldNotifyChange = false
  ): void => {
    if (!isSingle) {
      setToDate(dateValue || undefined);
      toDateRef.current = dateValue || null;
      if (shouldNotifyChange) {
        debounceNotifyChange();
      }
    }
  };

  useLayoutEffect(() => {
    if (!isClient) return;
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, handleResize]);

  useEffect(() => {
    if (!isClient) return;

    setIsFirstTime(true);
    const handleDocumentClick = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target) &&
        window.innerWidth >= 768
      ) {
        setComplsOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [isClient]); // Add isClient to dependencies

  useEffect(() => {
    const _startDateJs = startDate ? dayjs(startDate) : null;
    fromDateRef.current = _startDateJs;
    updateFromDate(_startDateJs, false);
  }, [startDate]);

  useEffect(() => {
    if (!isSingle) {
      const _endDateJs = endDate ? dayjs(endDate) : null;
      toDateRef.current = _endDateJs;
      updateToDate(_endDateJs, false);
    }
  }, [endDate, isSingle]);

  useEffect(() => {
    if (!complsOpen && isFirstTime) {
      const _startDate = fromDateRef.current?.toDate() || null;
      const _endDate = toDateRef.current?.toDate() || null;
      if (isSingle) {
        onCloseCalendar(_startDate, null);
      } else {
        onCloseCalendar(_startDate, _endDate);
      }
    }
  }, [complsOpen, isFirstTime, isSingle, onCloseCalendar]);

  useEffect(() => {
    setComplsOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isFirstTime) {
      const input =
        inputFocus === "from"
          ? "Start Date"
          : inputFocus === "to"
          ? "End Date"
          : "";
      onFocus(input);
    }
  }, [inputFocus, isFirstTime, onFocus]);

  // Event handlers
  const toggleDialog = (): void => {
    setComplsOpen(!complsOpen);
  };

  const handleClickDateInput = (focusInput: "from" | "to"): void => {
    if (disabled || (!isSingle && focusInput === "to" && !fromDate)) {
      return;
    }

    if (!complsOpen) {
      setComplsOpen(true);
    }

    setInputFocus(focusInput);
  };

  const onSelectDate = useCallback(
    (date: Dayjs): void => {
      const minDayjs = minDate ? dayjs(minDate) : null;
      const maxDayjs = maxDate ? dayjs(maxDate) : null;

      if (
        (minDayjs && minDayjs.isAfter(date, "date")) ||
        (maxDayjs && maxDayjs.isBefore(date, "date"))
      ) {
        return;
      }

      if (isSingle) {
        updateFromDate(date, true);
        if (hideDialogAfterSelectEndDate) {
          setTimeout(() => setComplsOpen(false), 50);
        }
      } else if (
        inputFocus === "from" ||
        (fromDate && date.isBefore(fromDate, "date"))
      ) {
        updateFromDate(date, true);
        if (toDate && date.isAfter(toDate, "date")) {
          updateToDate(null, true);
        }
        setInputFocus("to");
      } else {
        updateToDate(date, true);
        setInputFocus(null);
        if (hideDialogAfterSelectEndDate) {
          setTimeout(() => setComplsOpen(false), 50);
        }
      }
    },
    [
      minDate,
      maxDate,
      isSingle,
      hideDialogAfterSelectEndDate,
      inputFocus,
      fromDate,
      toDate,
    ]
  );

  const onHoverDate = (date: Dayjs): void => {
    setHoverDate(date);
  };

  const handleReset = (): void => {
    setHoverDate(undefined);
    updateFromDate(null, true);
    if (!isSingle) {
      updateToDate(null, true);
    }
    setInputFocus("from");
  };

  const handleChangeDate = useCallback(
    (date: Dayjs, type: "from" | "to"): void => {
      const minDayjs = minDate ? dayjs(minDate) : null;
      const maxDayjs = maxDate ? dayjs(maxDate) : null;

      if (
        (minDayjs && minDayjs.isAfter(date, "date")) ||
        (maxDayjs && maxDayjs.isBefore(date, "date"))
      ) {
        return;
      }

      if (type === "from" || isSingle) {
        setInputFocus("from");
        updateFromDate(date, true);
        if (!isSingle && toDate && date.isAfter(toDate, "date")) {
          updateToDate(null, true);
        }
      } else {
        setInputFocus("to");
        updateToDate(date, true);
      }
    },
    [minDate, maxDate, isSingle, toDate, inputFocus]
  );

  // Create context values
  const dateState: DateState = {
    fromDate,
    toDate,
    hoverDate,
    inputFocus,
    onSelectDate,
    onHoverDate,
    handleChangeDate,
    handleReset,
    handleClickDateInput,
  };

  const config: DatePickerConfig = {
    isSingle,
    startWeekDay,
    minDate: minDate ? dayjs(minDate).toDate() : null,
    maxDate: maxDate ? dayjs(maxDate).toDate() : null,
    weekDayFormat,
    dateFormat,
    monthFormat,
    highlightToday,
    singleCalendar,
    expandDirection,
    locale,
  };

  const uiState: UIState = {
    complsOpen,
    isMobile,
    disabled,
    toggleDialog,
  };

  const display: DisplayCustomization = {
    startDatePlaceholder,
    endDatePlaceholder,
    dateInputSeperator,
    hideDialogHeader,
    hideDialogFooter,
    hideDialogAfterSelectEndDate,
    tooltip,
    subTextDict,
  };

  return (
    <div className="react-google-flight-datepicker">
      <div
        className={cx("date-picker", className, {
          disabled,
        })}
        ref={containerRef}
      >
        <DatePickerProvider
          dateState={dateState}
          config={config}
          uiState={uiState}
          display={display}
          locale={locale}
        >
          <DateInputGroup />
          <DialogWrapper>
            <Dialog />
          </DialogWrapper>
        </DatePickerProvider>
      </div>
    </div>
  );
};

export default BaseDatePicker;
