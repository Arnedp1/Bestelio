import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/context";
import { formatCents } from "@/lib/utils/money";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { PaymentConfirm } from "@/components/storefront/PaymentConfirm";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Ontvangen",
  CONFIRMED: "Bevestigd",
  PREPARING: "In bereiding",
  READY: "Klaar om af te halen",
  COMPLETED: "Afgerond",
  CANCELLED: "Geannuleerd",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requireTenant();

  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: { timeSlotInstance: true, payment: true },
  });

  if (!order) notFound();

  return (
    <StorefrontShell>
      <Suspense>
        <PaymentConfirm
          orderId={order.id}
          paymentStatus={order.payment?.status ?? null}
          hasOnlinePayment={!!order.payment?.providerRef}
        />
      </Suspense>
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Bedankt!</h1>
        <p className="mt-1 text-stone-500">Bestelling #{order.orderNumber}</p>

        <dl className="mt-6 space-y-3 text-left text-sm">
          <div className="flex justify-between border-b border-stone-100 pb-2">
            <dt className="text-stone-500">Status</dt>
            <dd className="font-semibold">{STATUS_LABELS[order.status] ?? order.status}</dd>
          </div>
          {order.payment && (
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <dt className="text-stone-500">Betaling</dt>
              <dd className="font-semibold">
                {order.payment.status === "PAID" ? "Betaald" : "Nog te betalen"}
              </dd>
            </div>
          )}
          {order.timeSlotInstance && (
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <dt className="text-stone-500">
                {order.fulfillment === "PICKUP" ? "Afhalen" : "Leveren"}
              </dt>
              <dd className="font-semibold">
                {order.timeSlotInstance.startsAt.toLocaleTimeString("nl-BE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <dt className="text-stone-500">Totaal</dt>
            <dd className="text-lg font-bold text-[var(--brand)]">
              {formatCents(order.totalCents)}
            </dd>
          </div>
        </dl>

        <Link href="/" className="btn-primary mt-8 inline-flex w-full">
          Terug naar menu
        </Link>
      </div>
    </StorefrontShell>
  );
}
