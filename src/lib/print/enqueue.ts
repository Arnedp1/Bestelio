import { buildKitchenTicketPayload } from "./kitchen-ticket";
import { buildVatTicketPayload } from "./vat-ticket";
import type { KitchenTicketPayload, VatTicketPayload } from "./types";
import { insertKitchenPrintJob, insertPrintJob } from "./jobs";

export async function enqueueKitchenPrintJob(
  tenantId: string,
  orderId: string
): Promise<{ ok: true; jobId: string } | { ok: false; reason: "not_found" }> {
  const payload = await buildKitchenTicketPayload(tenantId, orderId);
  if (!payload) {
    return { ok: false, reason: "not_found" };
  }

  const jobId = await insertKitchenPrintJob(tenantId, orderId, payload);

  return { ok: true, jobId };
}

export function parseKitchenTicketPayload(raw: unknown): KitchenTicketPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<KitchenTicketPayload>;
  if (!p.orderNumber || !Array.isArray(p.lines)) return null;
  return p as KitchenTicketPayload;
}

export async function enqueueVatPrintJob(
  tenantId: string,
  orderId: string
): Promise<{ ok: true; jobId: string } | { ok: false; reason: "not_found" }> {
  const payload = await buildVatTicketPayload(tenantId, orderId);
  if (!payload) {
    return { ok: false, reason: "not_found" };
  }

  const jobId = await insertPrintJob(tenantId, orderId, "VAT_TICKET", payload);
  return { ok: true, jobId };
}

export function parseVatTicketPayload(raw: unknown): VatTicketPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<VatTicketPayload>;
  if (!p.orderNumber || !Array.isArray(p.lines) || p.vatRatePercent == null) return null;
  return p as VatTicketPayload;
}
