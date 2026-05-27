import { NextResponse } from "next/server";
import { z } from "zod";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/context";
import { verifyMolliePayment } from "@/lib/payments/provider";
import { enqueueKitchenPrintJob } from "@/lib/print/enqueue";

const schema = z.object({ orderId: z.string().cuid() });

export async function POST(request: Request) {
  try {
    const tenant = await requireTenant();
    const { orderId } = schema.parse(await request.json());

    const payment = await prisma.payment.findFirst({
      where: { order: { id: orderId, tenantId: tenant.id } },
    });

    if (!payment) {
      return NextResponse.json({ status: "PENDING" as PaymentStatus });
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ status: "PAID" });
    }

    if (!payment.providerRef) {
      return NextResponse.json({ status: payment.status });
    }

    const verified = await verifyMolliePayment(tenant.id, payment.providerRef);

    if (verified === "PAID") {
      const updated = await prisma.payment.updateMany({
        where: { id: payment.id, status: { not: "PAID" } },
        data: { status: "PAID" },
      });
      if (updated.count > 0) {
        void enqueueKitchenPrintJob(tenant.id, payment.orderId).catch((err) => {
          console.error("[print] enqueue after payment confirm failed", err);
        });
      }
      return NextResponse.json({ status: "PAID" });
    }

    if (verified === "FAILED" && payment.status !== "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({
      status: verified === "PENDING" ? "PENDING" : payment.status,
    });
  } catch (e) {
    console.error("[payments/confirm]", e);
    return NextResponse.json(
      { error: "Betaling kon niet worden gecontroleerd." },
      { status: 500 }
    );
  }
}
