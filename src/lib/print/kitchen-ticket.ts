import { prisma } from "@/lib/prisma";
import type { KitchenTicketPayload } from "./types";

function formatPickupLabel(startsAt: Date | null | undefined): string {
  if (!startsAt) return "Afhaaltijd: z.s.m.";
  const label = startsAt.toLocaleString("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Afhaaltijd: ${label}`;
}

function formatCreatedAt(createdAt: Date): string {
  return createdAt.toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function buildKitchenTicketPayload(
  tenantId: string,
  orderId: string
): Promise<KitchenTicketPayload | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      lines: { include: { modifiers: true }, orderBy: { id: "asc" } },
      timeSlotInstance: true,
      tenant: { include: { brandSettings: true } },
    },
  });

  if (!order) return null;

  return {
    storeName: order.tenant.brandSettings?.displayName ?? order.tenant.name,
    orderNumber: order.orderNumber,
    createdAt: formatCreatedAt(order.createdAt),
    pickupLabel: formatPickupLabel(order.timeSlotInstance?.startsAt ?? order.scheduledAt),
    fulfillment: order.fulfillment,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    notes: order.notes,
    lines: order.lines.map((line) => ({
      quantity: line.quantity,
      name: line.name,
      modifiers: line.modifiers.map((m) => m.name),
    })),
    totalCents: order.totalCents,
  };
}
