import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { getAdminOrdersSnapshot } from "@/lib/admin/orders";
import { enqueueKitchenPrintJob } from "@/lib/print/enqueue";

export async function GET() {
  try {
    const admin = await requireAdminApi();
    const snapshot = await getAdminOrdersSnapshot(admin.tenantId);
    return NextResponse.json(snapshot);
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

const createManualOrderSchema = z
  .object({
    customerName: z.string().min(1).max(100),
    customerPhone: z.string().min(3).max(40),
    fulfillment: z.enum(["PICKUP", "DELIVERY"]),
    customerAddress: z.string().max(250).optional(),
    notes: z.string().max(500).optional(),
    totalEuro: z.coerce.number().min(0.01).max(9999),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "DELIVERY" && !data.customerAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerAddress"],
        message: "Adres is verplicht bij levering",
      });
    }
  });

function manualOrderNumber(): string {
  const n = Date.now().toString(36).toUpperCase();
  return `A-${n.slice(-8)}`;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const payload = createManualOrderSchema.parse(await request.json());
    const totalCents = Math.round(payload.totalEuro * 100);

    const order = await prisma.order.create({
      data: {
        tenantId: admin.tenantId,
        orderNumber: manualOrderNumber(),
        status: "CONFIRMED",
        fulfillment: payload.fulfillment,
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone.trim(),
        customerAddress:
          payload.fulfillment === "DELIVERY"
            ? (payload.customerAddress?.trim() ?? null)
            : null,
        notes: payload.notes?.trim() || null,
        subtotalCents: totalCents,
        totalCents,
        lines: {
          create: [
            {
              name: "Manuele bestelling",
              quantity: 1,
              unitPriceCents: totalCents,
              lineTotalCents: totalCents,
            },
          ],
        },
        payment: {
          create: {
            status: "PAID",
            amountCents: totalCents,
            provider: "manual",
          },
        },
      },
    });

    void enqueueKitchenPrintJob(admin.tenantId, order.id).catch((err) => {
      console.error("[admin/orders] enqueue print failed", err);
    });

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, reason: "validation", issues: e.flatten() },
        { status: 400 }
      );
    }
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
