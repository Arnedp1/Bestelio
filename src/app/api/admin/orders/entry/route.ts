import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { getCart, clearCart, setCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import { createOrder } from "@/lib/orders/create";
import { prisma } from "@/lib/prisma";

const adminEntrySchema = z
  .object({
    customerName: z.string().trim().max(100).optional(),
    customerPhone: z.string().trim().max(20).optional(),
    customerEmail: z.string().trim().email().optional().or(z.literal("")),
    customerAddress: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(500).optional(),
    fulfillment: z.enum(["PICKUP", "DELIVERY"]),
    timeSlotInstanceId: z.string().cuid(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY") {
      const addr = data.customerAddress?.trim() ?? "";
      if (addr.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerAddress"],
          message: "Vul een geldig leveradres in (minstens 5 tekens).",
        });
      }
    }
  });

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const body = adminEntrySchema.parse(await request.json());
    const rawCart = await getCart();
    const { cart, hadStaleLines } = await resolveCartForTenant(admin.tenantId, rawCart);

    if (hadStaleLines) {
      await setCart(cart);
    }

    if (cart.lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason: "invalid_cart",
          message: "Winkelmandje is leeg of verouderd.",
        },
        { status: 400 }
      );
    }

    const settings = await prisma.businessSettings.findUnique({
      where: { tenantId: admin.tenantId },
      select: { minOrderCents: true },
    });

    const result = await createOrder({
      tenantId: admin.tenantId,
      fulfillment: body.fulfillment,
      customerName: body.customerName?.trim() || "Ter plaatse",
      customerPhone: body.customerPhone?.trim() || "n.v.t.",
      customerEmail: body.customerEmail || undefined,
      customerAddress: body.customerAddress,
      notes: body.notes,
      timeSlotInstanceId: body.timeSlotInstanceId,
      cart,
      minOrderCents: settings?.minOrderCents ?? 0,
    });

    if (!result.ok) {
      const status = result.reason === "min_order" ? 400 : 409;
      return NextResponse.json(result, { status });
    }

    await clearCart();
    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { ok: false, reason: "validation", issues: e.flatten() },
        { status: 400 }
      );
    }
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[admin/orders/entry]", e);
    return NextResponse.json(
      { ok: false, reason: "server_error", message: "Bestelling aanmaken mislukt." },
      { status: 500 }
    );
  }
}
