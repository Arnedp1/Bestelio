import { z } from "zod";

export const checkoutSchema = z
  .object({
    customerName: z
      .string({ required_error: "Vul je naam in." })
      .trim()
      .min(2, "Naam moet minstens 2 tekens zijn.")
      .max(100, "Naam is te lang (max. 100 tekens)."),
    customerPhone: z
      .string({ required_error: "Vul je telefoonnummer in." })
      .trim()
      .min(8, "Telefoonnummer moet minstens 8 tekens zijn.")
      .max(20, "Telefoonnummer is te lang."),
    customerEmail: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || z.string().email().safeParse(val).success,
        "Vul een geldig e-mailadres in of laat het veld leeg."
      ),
    customerAddress: z.string().trim().max(300, "Adres is te lang (max. 300 tekens).").optional(),
    notes: z.string().trim().max(500, "Opmerkingen zijn te lang (max. 500 tekens).").optional(),
    fulfillment: z.enum(["PICKUP", "DELIVERY"], {
      required_error: "Kies afhalen of leveren.",
      invalid_type_error: "Kies afhalen of leveren.",
    }),
    timeSlotInstanceId: z
      .string({ required_error: "Kies een tijdslot." })
      .cuid("Kies een geldig tijdslot."),
    payOnline: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY") {
      const addr = data.customerAddress?.trim() ?? "";
      if (addr.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerAddress"],
          message: "Vul een geldig leveradres in (minstens 5 tekens).",
        });
      }
    }
  });

export const CHECKOUT_FIELD_LABELS: Record<string, string> = {
  customerName: "Naam",
  customerPhone: "Telefoon",
  customerEmail: "E-mail",
  customerAddress: "Adres",
  notes: "Opmerkingen",
  fulfillment: "Afhalen of leveren",
  timeSlotInstanceId: "Tijdslot",
};

/** Eén foutmelding per veld (eerste issue wint). */
export function checkoutFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Korte opsomming voor boven het formulier. */
export function checkoutValidationSummary(fieldErrors: Record<string, string>): string {
  const lines = Object.entries(fieldErrors).map(([key, msg]) => {
    const label = CHECKOUT_FIELD_LABELS[key] ?? key;
    return `${label}: ${msg}`;
  });
  if (lines.length === 0) return "Controleer je gegevens en probeer opnieuw.";
  if (lines.length === 1) return lines[0];
  return `Controleer de volgende velden:\n${lines.map((l) => `• ${l}`).join("\n")}`;
}
