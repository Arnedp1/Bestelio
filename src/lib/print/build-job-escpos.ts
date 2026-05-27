import { buildKitchenTicketEscpos, buildVatTicketEscpos } from "./escpos";
import { parseKitchenTicketPayload, parseVatTicketPayload } from "./enqueue";

export type PrintJobKind = "KITCHEN" | "VAT_TICKET";

export function buildEscposBase64ForJob(
  type: PrintJobKind,
  payload: unknown
): { ok: true; base64: string; orderNumber: string } | { ok: false; error: string } {
  if (type === "KITCHEN") {
    const parsed = parseKitchenTicketPayload(payload);
    if (!parsed) return { ok: false, error: "Ongeldige keukenbon-payload" };
    return {
      ok: true,
      orderNumber: parsed.orderNumber,
      base64: buildKitchenTicketEscpos(parsed).toString("base64"),
    };
  }

  const parsed = parseVatTicketPayload(payload);
  if (!parsed) return { ok: false, error: "Ongeldige BTW-bon-payload" };
  return {
    ok: true,
    orderNumber: parsed.orderNumber,
    base64: buildVatTicketEscpos(parsed).toString("base64"),
  };
}
