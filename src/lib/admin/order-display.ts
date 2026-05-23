import type { OrderStatus, PaymentStatus } from "@prisma/client";

export type AdminOrderDisplayInput = {
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
};

export function adminOrderIsOpen(order: Pick<AdminOrderDisplayInput, "status">): boolean {
  return order.status !== "COMPLETED" && order.status !== "CANCELLED";
}

/** Badge-sleutel voor kleuren in StatusBadge. */
export function adminOrderBadgeKey(order: AdminOrderDisplayInput): string {
  if (order.status === "CANCELLED") return "CANCELLED";
  if (order.status === "COMPLETED") return "COMPLETED";
  if (order.paymentStatus === "PAID") return "PAID";
  if (order.paymentStatus === "FAILED") return "FAILED";
  return "OPEN";
}

export function adminOrderStatusLabel(order: AdminOrderDisplayInput): string {
  if (order.status === "CANCELLED") return "Geannuleerd";
  if (order.status === "COMPLETED") return "Afgerond";
  if (order.paymentStatus === "PAID") return "Online betaald";
  if (order.paymentStatus === "FAILED") return "Betaling mislukt";
  if (order.paymentStatus === "PENDING") return "Betaling open";
  return "Nieuw";
}
