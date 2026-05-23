const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDateFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  if (!ISO_RE.test(iso)) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateDisplay(iso: string, locale = "nl-BE"): string {
  return parseIsoDate(iso).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Compact label met weekdag (checkout). */
export function formatDateDisplayShort(iso: string, locale = "nl-BE"): string {
  return parseIsoDate(iso).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(year: number, month: number, locale = "nl-BE"): string {
  return new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return isoDateFromDate(d);
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isIsoInRange(iso: string, min?: string, max?: string): boolean {
  if (min && compareIso(iso, min) < 0) return false;
  if (max && compareIso(iso, max) > 0) return false;
  return true;
}

/** Maandgrid: 6 rijen × 7 kolommen, maandag = eerste kolom. */
export function buildCalendarMonth(year: number, month: number): {
  iso: string;
  day: number;
  inMonth: boolean;
}[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const cells: { iso: string; day: number; inMonth: boolean }[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      iso: isoDateFromDate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }

  return cells;
}

export const WEEKDAY_LABELS_NL = ["ma", "di", "wo", "do", "vr", "za", "zo"] as const;
