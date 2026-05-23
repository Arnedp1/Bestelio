import type { FulfillmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Cart } from "@/lib/cart/types";
import { cartSubtotalCents } from "@/lib/cart/types";
import { bookTimeSlot, releaseTimeSlot } from "@/lib/slots/booking";

export type CreateOrderInput = {
  tenantId: string;
  fulfillment: FulfillmentType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  timeSlotInstanceId: string;
  cart: Cart;
  minOrderCents?: number;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; totalCents: number }
  | {
      ok: false;
      reason:
        | "slot_full"
        | "empty_cart"
        | "slot_not_found"
        | "min_order"
        | "invalid_cart";
      suggestedSlotId?: string;
      minOrderCents?: number;
    };

function generateOrderNumber(): string {
  const n = Date.now().toString(36).toUpperCase();
  return `H-${n.slice(-8)}`;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.cart.lines.length === 0) {
    return { ok: false, reason: "empty_cart" };
  }

  const subtotal = cartSubtotalCents(input.cart);
  const minOrder = input.minOrderCents ?? 0;
  if (subtotal < minOrder) {
    return { ok: false, reason: "min_order", minOrderCents: minOrder };
  }

  const booking = await bookTimeSlot({
    tenantId: input.tenantId,
    slotInstanceId: input.timeSlotInstanceId,
  });

  if (!booking.ok) {
    return {
      ok: false,
      reason: booking.reason === "slot_not_found" ? "slot_not_found" : "slot_full",
      suggestedSlotId: "suggestedSlotId" in booking ? booking.suggestedSlotId : undefined,
    };
  }

  const orderNumber = generateOrderNumber();

  try {
    const slot = await prisma.timeSlotInstance.findFirst({
      where: { id: input.timeSlotInstanceId, tenantId: input.tenantId },
    });

    const order = await prisma.order.create({
      data: {
        tenantId: input.tenantId,
        orderNumber,
        fulfillment: input.fulfillment,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        customerAddress: input.customerAddress,
        notes: input.notes,
        subtotalCents: subtotal,
        totalCents: subtotal,
        timeSlotInstanceId: input.timeSlotInstanceId,
        scheduledAt: slot?.startsAt,
        lines: {
          create: input.cart.lines.map((line) => {
            const modTotal = line.modifiers.reduce((s, m) => s + m.priceCents, 0);
            const unit = line.unitPriceCents + modTotal;
            return {
              productId: line.productId,
              name: line.name,
              quantity: line.quantity,
              unitPriceCents: unit,
              lineTotalCents: unit * line.quantity,
              modifiers: {
                create: line.modifiers.map((m) => ({
                  optionId: m.optionId,
                  name: m.name,
                  priceCents: m.priceCents,
                })),
              },
            };
          }),
        },
        payment: {
          create: {
            status: "PENDING",
            amountCents: subtotal,
            provider: "manual",
          },
        },
      },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: subtotal,
    };
  } catch (e) {
    await releaseTimeSlot({
      tenantId: input.tenantId,
      slotInstanceId: input.timeSlotInstanceId,
    });
    throw e;
  }
}
