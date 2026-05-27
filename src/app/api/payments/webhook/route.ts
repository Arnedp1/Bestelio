import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMolliePayment } from "@/lib/payments/provider";
import { enqueueKitchenPrintJob } from "@/lib/print/enqueue";

export async function POST(request: Request) {
  const body = await request.formData().catch(() => null);
  const id =
    body?.get("id")?.toString() ??
    ((await request.json().catch(() => null)) as { id?: string } | null)?.id;

  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: id },
    include: { order: true },
  });

  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  const status = await verifyMolliePayment(payment.order.tenantId, id);

  if (status === "PAID") {
    const updated = await prisma.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
    if (updated.count > 0) {
      void enqueueKitchenPrintJob(payment.order.tenantId, payment.orderId).catch((err) => {
        console.error("[print] enqueue after webhook failed", err);
      });
    }
  } else if (status === "FAILED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}
