import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { buildTestReceiptEscpos } from "@/lib/print/escpos";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const admin = await requireAdminApi();
    const body = (await req.json()) as { printerName?: string };
    const printerName = body.printerName?.trim();
    if (!printerName) {
      return NextResponse.json({ error: "printerName is verplicht." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: admin.tenantId },
      include: { brandSettings: true },
    });
    const storeName = tenant?.brandSettings?.displayName ?? tenant?.name ?? "Test";

    const escposBase64 = buildTestReceiptEscpos({
      storeName,
      printerName,
    }).toString("base64");

    return NextResponse.json({ ok: true, escposBase64 });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[print/test-ticket]", e);
    return NextResponse.json({ error: "Testbon kon niet worden gemaakt." }, { status: 500 });
  }
}
