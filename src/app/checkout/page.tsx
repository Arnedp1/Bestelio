import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/tenant/context";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart/cookie";
import { getPaymentSetup } from "@/lib/payments/resolve";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";

export default async function CheckoutPage() {
  const tenant = await requireTenant();
  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/cart");

  const [settings, paymentSetup] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { tenantId: tenant.id } }),
    getPaymentSetup(tenant.id),
  ]);

  return (
    <StorefrontShell>
      <Link
        href="/cart"
        className="inline-flex text-sm font-medium text-stone-500 hover:text-[var(--brand)]"
      >
        ← Winkelmand
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-stone-900">Afrekenen</h1>
      <p className="mt-1 text-sm text-stone-500">Vul je gegevens in en kies een tijdslot</p>
      <CheckoutForm
        pickupEnabled={settings?.pickupEnabled ?? true}
        deliveryEnabled={settings?.deliveryEnabled ?? false}
        onlinePaymentsEnabled={paymentSetup.onlinePaymentsEnabled}
        requireOnlinePayment={paymentSetup.requireOnlinePayment}
        minOrderCents={settings?.minOrderCents ?? 0}
        paymentMode={paymentSetup.mode}
        canPayOnline={paymentSetup.canPayOnline}
      />
    </StorefrontShell>
  );
}
