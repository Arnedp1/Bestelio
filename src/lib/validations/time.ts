import { z } from "zod";

function formatHhMm(h: number, m: number): string | undefined {
  if (h > 23 || m > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Normaliseert tijdinvoer naar HH:MM (23 → 23:00, 9:00, 22:00:00, …). */
export function normalizeHhMm(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value).trim();

  const withSep = s.match(/^(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?$/);
  if (withSep) {
    return formatHhMm(Number(withSep[1]), Number(withSep[2]));
  }

  if (/^\d{1,2}$/.test(s)) {
    return formatHhMm(Number(s), 0);
  }

  return undefined;
}

export const hhMmSchema = z.preprocess(
  (v) => normalizeHhMm(v),
  z
    .string({ required_error: "Vul een geldige tijd in (HH:MM)" })
    .regex(/^\d{2}:\d{2}$/, "Gebruik formaat HH:MM, bijv. 11:00")
);
