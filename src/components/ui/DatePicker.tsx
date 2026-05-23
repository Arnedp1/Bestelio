"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  addDaysIso,
  buildCalendarMonth,
  formatDateDisplay,
  formatDateDisplayShort,
  formatMonthYear,
  isoDateFromDate,
  isIsoInRange,
  parseIsoDate,
  WEEKDAY_LABELS_NL,
} from "@/lib/dates/calendar";

type DatePickerProps = {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "default" | "compact";
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function todayIso(): string {
  return isoDateFromDate(new Date());
}

export function DatePicker({
  name,
  id: idProp,
  value: controlledValue,
  defaultValue,
  onChange,
  min,
  max,
  required,
  disabled,
  className = "input-field",
  size = "default",
  placeholder = "Kies een datum",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listboxId = `${id}-calendar`;

  const initial = controlledValue ?? defaultValue ?? "";
  const [internal, setInternal] = useState(initial);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = controlledValue ?? internal;
  const viewDate = selected ? parseIsoDate(selected) : new Date();
  const [viewYear, setViewYear] = useState(viewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(viewDate.getMonth());

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternal(controlledValue);
    }
  }, [controlledValue]);

  useEffect(() => {
    if (!selected) return;
    const d = parseIsoDate(selected);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selected]);

  const setValue = useCallback(
    (iso: string) => {
      if (controlledValue === undefined) setInternal(iso);
      onChange?.(iso);
    },
    [controlledValue, onChange]
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectDay(iso: string) {
    if (!isIsoInRange(iso, min, max)) return;
    setValue(iso);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const cells = buildCalendarMonth(viewYear, viewMonth);
  const displayLabel = selected
    ? size === "compact"
      ? formatDateDisplayShort(selected)
      : formatDateDisplay(selected)
    : placeholder;

  return (
    <div
      ref={rootRef}
      className={size === "compact" ? "date-picker date-picker--compact relative" : "date-picker relative"}
    >
      {name && (
        <input type="hidden" name={name} value={selected} required={required && !selected} />
      )}

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-describedby={ariaDescribedBy}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`date-picker-trigger ${className} ${!selected ? "date-picker-trigger--placeholder" : ""} ${ariaInvalid ? "input-field-error" : ""}`}
      >
        <span className="date-picker-trigger-icon" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{displayLabel}</span>
        <span className="date-picker-trigger-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          id={listboxId}
          role="dialog"
          aria-label="Kalender"
          className="date-picker-popover"
        >
          <div className="date-picker-popover-header">
            <button
              type="button"
              className="date-picker-nav"
              aria-label="Vorige maand"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p className="date-picker-month">{formatMonthYear(viewYear, viewMonth)}</p>
            <button
              type="button"
              className="date-picker-nav"
              aria-label="Volgende maand"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAY_LABELS_NL.map((d) => (
              <span key={d} className="date-picker-weekday">
                {d}
              </span>
            ))}
          </div>

          <div className="date-picker-grid" role="grid">
            {cells.map((cell) => {
              const isSelected = selected === cell.iso;
              const isToday = cell.iso === todayIso();
              const inRange = isIsoInRange(cell.iso, min, max);
              const isDisabled = !inRange;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  role="gridcell"
                  disabled={isDisabled}
                  aria-selected={isSelected}
                  aria-label={formatDateDisplay(cell.iso)}
                  onClick={() => selectDay(cell.iso)}
                  className={[
                    "date-picker-day",
                    !cell.inMonth && "date-picker-day--muted",
                    isToday && "date-picker-day--today",
                    isSelected && "date-picker-day--selected",
                    isDisabled && "date-picker-day--disabled",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-btn"
              disabled={!isIsoInRange(todayIso(), min, max)}
              onClick={() => selectDay(todayIso())}
            >
              Vandaag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Handig voor checkout: vandaag t/m +N dagen. */
export function checkoutDateBounds(daysAhead = 30): { min: string; max: string } {
  const min = todayIso();
  return { min, max: addDaysIso(min, daysAhead) };
}
