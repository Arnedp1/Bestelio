import type { ClosingException, OpeningHour } from "@prisma/client";

function isoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function findExceptionForDate(
  date: Date,
  exceptions: ClosingException[]
): ClosingException | undefined {
  const key = isoDateKey(date);
  return exceptions.find((e) => isoDateKey(e.date) === key);
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function parseTimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isOpenOnDate(
  date: Date,
  hours: OpeningHour[],
  exceptions: ClosingException[]
): boolean {
  const exception = findExceptionForDate(date, exceptions);
  if (exception) return !exception.isClosed;

  const hour = hours.find((h) => h.dayOfWeek === date.getDay());
  if (!hour) return false;
  return !hour.isClosed;
}

export type OpenStatusState = "open" | "closed_before" | "closed_after" | "closed_today";

export type OpenStatus = {
  state: OpenStatusState;
  openTime: string | null;
  closeTime: string | null;
  reason: string | null;
};

/** Of de zaak op dit moment open is (tijd + weekschema + uitzonderingen). */
export function getOpenStatus(
  now: Date,
  hours: OpeningHour[],
  exceptions: ClosingException[]
): OpenStatus {
  const exception = findExceptionForDate(now, exceptions);
  if (exception?.isClosed) {
    return {
      state: "closed_today",
      openTime: null,
      closeTime: null,
      reason: exception.reason,
    };
  }

  if (!isOpenOnDate(now, hours, exceptions)) {
    return { state: "closed_today", openTime: null, closeTime: null, reason: null };
  }

  const hour = hours.find((h) => h.dayOfWeek === now.getDay());
  if (!hour) {
    return { state: "closed_today", openTime: null, closeTime: null, reason: null };
  }

  const nowMin = minutesSinceMidnight(now);
  const openMin = parseTimeMinutes(hour.openTime);
  const closeMin = parseTimeMinutes(hour.closeTime);

  if (nowMin >= openMin && nowMin < closeMin) {
    return {
      state: "open",
      openTime: hour.openTime,
      closeTime: hour.closeTime,
      reason: null,
    };
  }

  if (nowMin < openMin) {
    return {
      state: "closed_before",
      openTime: hour.openTime,
      closeTime: hour.closeTime,
      reason: null,
    };
  }

  return {
    state: "closed_after",
    openTime: hour.openTime,
    closeTime: hour.closeTime,
    reason: null,
  };
}

export function formatOpenStatusMessage(status: OpenStatus): string {
  switch (status.state) {
    case "open":
      return `Nu open · tot ${status.closeTime}`;
    case "closed_before":
      return `Nu gesloten · opent om ${status.openTime}`;
    case "closed_after":
      return `Nu gesloten · vandaag tot ${status.closeTime}`;
    case "closed_today":
      return status.reason ? `Vandaag gesloten · ${status.reason}` : "Vandaag gesloten";
    default:
      return "Gesloten";
  }
}
