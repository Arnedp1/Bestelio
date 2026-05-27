import { addDaysIso, compareIso, isoDateFromDate } from "@/lib/dates/calendar";

export type AvailableSlotDto = {
  id: string;
  startsAt: string;
  endsAt: string;
  remaining?: number;
};

const DEFAULT_MAX_DAYS = 30;

export async function fetchAvailableSlotsForDate(
  fulfillment: "PICKUP" | "DELIVERY",
  date: string
): Promise<AvailableSlotDto[]> {
  const res = await fetch(
    `/api/slots/available?fulfillment=${fulfillment}&date=${encodeURIComponent(date)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { slots?: AvailableSlotDto[] };
  return data.slots ?? [];
}

/** Eerste dag (vanaf vandaag) met minstens één vrij tijdslot. */
export async function fetchFirstAvailableSlots(
  fulfillment: "PICKUP" | "DELIVERY",
  options?: { startDate?: string; maxDays?: number }
): Promise<{ date: string; slots: AvailableSlotDto[] }> {
  const maxDays = options?.maxDays ?? DEFAULT_MAX_DAYS;
  const start = options?.startDate ?? isoDateFromDate(new Date());
  const last = addDaysIso(start, maxDays);

  let date = start;
  while (compareIso(date, last) <= 0) {
    const slots = await fetchAvailableSlotsForDate(fulfillment, date);
    if (slots.length > 0) {
      return { date, slots };
    }
    date = addDaysIso(date, 1);
  }

  return { date: start, slots: [] };
}
