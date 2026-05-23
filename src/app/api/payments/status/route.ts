import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant/context";
import { getPaymentSetup } from "@/lib/payments/resolve";
import { getMollieApiKeyFromEnv } from "@/lib/payments/config";

export async function GET() {
  const tenant = await requireTenant();
  const setup = await getPaymentSetup(tenant.id);

  return NextResponse.json({
    ...setup,
    envSimulate: process.env.PAYMENT_SIMULATE === "true",
    hasEnvKey: Boolean(getMollieApiKeyFromEnv()),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
    hint:
      setup.mode === "mollie"
        ? "Mollie actief — bij checkout ga je naar het Mollie-betaalscherm."
        : setup.mode === "simulate"
          ? "Demo-modus: geen Mollie-scherm. Vul een test API-key in bij Admin → Instellingen."
          : "Geen betalingen: online betalen aan + Mollie-key in admin of .env.",
  });
}
