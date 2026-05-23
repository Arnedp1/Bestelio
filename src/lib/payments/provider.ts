import type { PaymentProvider } from "@prisma/client";
import { canUseMollieWebhook, getPublicAppUrl, paymentModeFromKey } from "./config";
import { resolveMollieApiKey, resolvePaymentMode } from "./resolve";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  customerEmail?: string;
  redirectUrl: string;
  appBaseUrl?: string;
};

export type CreatePaymentResult =
  | { ok: true; checkoutUrl: string; providerRef: string; simulated?: boolean }
  | { ok: false; error: string };

type MolliePaymentResponse = {
  id?: string;
  status?: string;
  _links?: {
    checkout?: { href?: string };
    paymentUrl?: { href?: string };
  };
  detail?: string;
  title?: string;
  field?: string;
};

function formatMollieAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function mollieCheckoutHref(data: MolliePaymentResponse): string | null {
  return data._links?.checkout?.href ?? data._links?.paymentUrl?.href ?? null;
}

function createSimulatedPayment(input: CreatePaymentInput): CreatePaymentResult {
  const base = input.redirectUrl.split("?")[0];
  const url = `${base}?payment=simulated`;
  return {
    ok: true,
    checkoutUrl: url,
    providerRef: `sim_${input.orderId}`,
    simulated: true,
  };
}

export async function createOnlinePayment(
  provider: PaymentProvider,
  tenantId: string,
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  if (provider === "MANUAL") {
    return { ok: false, error: "Online betaling niet ingeschakeld in instellingen." };
  }

  const apiKey = await resolveMollieApiKey(tenantId);
  const mode = paymentModeFromKey(Boolean(apiKey));

  if (mode === "simulate") {
    return createSimulatedPayment(input);
  }

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Mollie is niet geconfigureerd. Vul je test API-key in bij Admin → Instellingen of zet MOLLIE_API_KEY in .env.",
    };
  }

  if (input.amountCents < 1) {
    return { ok: false, error: "Bedrag moet minstens € 0,01 zijn." };
  }

  const appBase = getPublicAppUrl(input.appBaseUrl);
  const payload: Record<string, unknown> = {
    amount: { currency: "EUR", value: formatMollieAmount(input.amountCents) },
    description: `Bestelling ${input.orderNumber}`,
    redirectUrl: input.redirectUrl,
    metadata: { orderId: input.orderId },
  };

  const webhookUrl = `${appBase}/api/payments/webhook`;
  if (canUseMollieWebhook(appBase)) {
    payload.webhookUrl = webhookUrl;
  }

  const res = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as MolliePaymentResponse;

  if (!res.ok) {
    const detail = data.detail ?? data.title;
    const field = data.field ? ` (${data.field})` : "";
    console.error("[mollie] create payment failed", res.status, data);
    return {
      ok: false,
      error: detail
        ? `Mollie: ${detail}${field}`
        : `Mollie-betaling mislukt (HTTP ${res.status}). Controleer je API-key en of iDEAL/testmodus actief is in het Mollie-dashboard.`,
    };
  }

  const checkoutUrl = mollieCheckoutHref(data);
  if (!data.id || !checkoutUrl) {
    console.error("[mollie] unexpected create response", data);
    return { ok: false, error: "Mollie gaf geen betaallink terug." };
  }

  return {
    ok: true,
    checkoutUrl,
    providerRef: data.id,
  };
}

export async function verifyMolliePayment(
  tenantId: string,
  providerRef: string
): Promise<"PAID" | "PENDING" | "FAILED"> {
  if (providerRef.startsWith("sim_")) {
    const mode = await resolvePaymentMode(tenantId);
    return mode === "simulate" ? "PAID" : "FAILED";
  }

  const apiKey = await resolveMollieApiKey(tenantId);
  if (!apiKey) {
    return "FAILED";
  }

  const res = await fetch(`https://api.mollie.com/v2/payments/${providerRef}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[mollie] verify failed", res.status, providerRef);
    return "FAILED";
  }

  const data = (await res.json()) as { status?: string };
  const status = data.status ?? "";

  if (status === "paid") return "PAID";
  if (status === "open" || status === "pending" || status === "authorized") {
    return "PENDING";
  }
  return "FAILED";
}
