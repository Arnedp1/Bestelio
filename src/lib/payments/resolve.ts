import { prisma } from "@/lib/prisma";
import { getMollieApiKeyFromEnv, paymentModeFromKey } from "./config";

export type PaymentMode = "mollie" | "simulate" | "off";

export async function resolveMollieApiKey(tenantId: string): Promise<string | undefined> {
  const settings = await prisma.businessSettings.findUnique({
    where: { tenantId },
    select: { mollieApiKey: true },
  });

  const fromDb = settings?.mollieApiKey?.trim();
  if (fromDb) return fromDb;

  return getMollieApiKeyFromEnv();
}

export async function resolvePaymentMode(tenantId: string): Promise<PaymentMode> {
  const key = await resolveMollieApiKey(tenantId);
  return paymentModeFromKey(Boolean(key));
}

export async function getPaymentSetup(tenantId: string) {
  const settings = await prisma.businessSettings.findUnique({
    where: { tenantId },
    select: {
      onlinePaymentsEnabled: true,
      requireOnlinePayment: true,
      paymentProvider: true,
      mollieApiKey: true,
    },
  });

  const hasDbKey = Boolean(settings?.mollieApiKey?.trim());
  const hasEnvKey = Boolean(getMollieApiKeyFromEnv());
  const mode = await resolvePaymentMode(tenantId);
  const onlinePaymentsEnabled = settings?.onlinePaymentsEnabled ?? false;
  const canPayOnline =
    onlinePaymentsEnabled && settings?.paymentProvider === "MOLLIE" && mode !== "off";
  const requireOnlinePayment = settings?.requireOnlinePayment ?? false;

  return {
    mode,
    onlinePaymentsEnabled,
    requireOnlinePayment,
    paymentProvider: settings?.paymentProvider ?? "MANUAL",
    mollieConfigured: hasDbKey || hasEnvKey,
    mollieKeySource: hasDbKey ? ("admin" as const) : hasEnvKey ? ("env" as const) : null,
    canPayOnline,
    mustPayOnline: requireOnlinePayment && canPayOnline,
  };
}
