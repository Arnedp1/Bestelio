/** API-key uit .env (fallback als admin geen key heeft ingevuld). */
export function getMollieApiKeyFromEnv(): string | undefined {
  const key = process.env.MOLLIE_API_KEY?.trim();
  if (!key) return undefined;
  return key;
}

/** Echte Mollie zodra er een key is; anders optioneel simuleren. */
export function paymentModeFromKey(hasApiKey: boolean): "mollie" | "simulate" | "off" {
  if (hasApiKey) return "mollie";
  if (process.env.PAYMENT_SIMULATE === "true") return "simulate";
  return "off";
}

export function getPublicAppUrl(fallbackOrigin?: string): string {
  const fromEnv =
    process.env.NEXTAUTH_URL?.trim() || process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Mollie kan geen webhook naar localhost sturen — die URL weglaten. */
export function canUseMollieWebhook(baseUrl: string): boolean {
  try {
    const u = new URL(baseUrl);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return false;
    }
    if (host.endsWith(".local")) return false;
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
