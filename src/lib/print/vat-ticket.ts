import { prisma } from "@/lib/prisma";
import { BE_FOOD_VAT_RATE, splitInclusiveVatCents, sumVatBreakdown } from "@/lib/vat/belgian";
import type { VatTicketPayload } from "./types";

function formatCreatedAt(createdAt: Date): string {
  return createdAt.toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function buildVatTicketPayload(
  tenantId: string,
  orderId: string
): Promise<VatTicketPayload | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      lines: { orderBy: { id: "asc" } },
      tenant: { include: { brandSettings: true } },
    },
  });

  if (!order) return null;

  const lines = order.lines.map((line) => {
    const { exclCents, vatCents } = splitInclusiveVatCents(line.lineTotalCents, BE_FOOD_VAT_RATE);
    return {
      quantity: line.quantity,
      name: line.name,
      lineTotalInclCents: line.lineTotalCents,
      exclCents,
      vatCents,
    };
  });

  const totals = sumVatBreakdown(lines);

  return {
    storeName: order.tenant.brandSettings?.displayName ?? order.tenant.name,
    orderNumber: order.orderNumber,
    createdAt: formatCreatedAt(order.createdAt),
    customerName: order.customerName,
    vatRatePercent: BE_FOOD_VAT_RATE,
    lines,
    totalExclCents: totals.exclCents,
    totalVatCents: totals.vatCents,
    totalInclCents: totals.inclCents,
  };
}
