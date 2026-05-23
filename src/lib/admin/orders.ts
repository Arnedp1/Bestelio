import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminOrderLineDto = {
  id: string;
  name: string;
  quantity: number;
  lineTotalCents: number;
  modifiers: { name: string; priceCents: number }[];
};

export type AdminOrderDto = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  fulfillment: "PICKUP" | "DELIVERY";
  totalCents: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
  createdAt: string;
  timeSlotLabel: string | null;
  lines: AdminOrderLineDto[];
};

export type AdminOrdersSnapshot = {
  orders: AdminOrderDto[];
  openCount: number;
  todayRevenueCents: number;
};

export async function getAdminOrdersSnapshot(
  tenantId: string
): Promise<AdminOrdersSnapshot> {
  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      payment: { select: { status: true } },
      timeSlotInstance: true,
      lines: {
        include: { modifiers: true },
      },
    },
  });

  const openCount = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  ).length;
  const today = new Date().toDateString();
  const todayRevenueCents = orders
    .filter(
      (o) =>
        new Date(o.createdAt).toDateString() === today &&
        o.status !== "CANCELLED"
    )
    .reduce((s, o) => s + o.totalCents, 0);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      customerAddress: o.customerAddress,
      notes: o.notes,
      fulfillment: o.fulfillment,
      totalCents: o.totalCents,
      status: o.status,
      paymentStatus: o.payment?.status ?? null,
      createdAt: o.createdAt.toISOString(),
      timeSlotLabel: o.timeSlotInstance
        ? o.timeSlotInstance.startsAt.toLocaleString("nl-BE", {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      lines: o.lines.map((line) => ({
        id: line.id,
        name: line.name,
        quantity: line.quantity,
        lineTotalCents: line.lineTotalCents,
        modifiers: line.modifiers.map((m) => ({
          name: m.name,
          priceCents: m.priceCents,
        })),
      })),
    })),
    openCount,
    todayRevenueCents,
  };
}
