"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
  /** Overrides default + behaviour (e.g. open extras popup). */
  onPlusClick?: () => void;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled = false,
  onPlusClick,
}: Props) {
  const btn =
    size === "xs" ? "h-7 w-7 text-sm" : size === "sm" ? "h-8 w-8 text-base" : "h-10 w-10 text-lg";

  return (
    <div className="inline-flex items-center rounded-full border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        aria-label="Minder"
        className={`${btn} font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span
        className={`text-center font-bold tabular-nums text-stone-900 ${
          size === "xs" ? "min-w-7 text-xs" : size === "sm" ? "min-w-8 text-sm" : "min-w-9 text-base"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Meer"
        className={`${btn} font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40`}
        disabled={disabled || value >= max}
        onClick={() =>
          onPlusClick ? onPlusClick() : onChange(Math.min(max, value + 1))
        }
      >
        +
      </button>
    </div>
  );
}
