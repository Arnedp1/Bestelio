import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { enqueueKitchenPrintJob } from "@/lib/print/enqueue";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi();
    const { id: orderId } = await params;

    const result = await enqueueKitchenPrintJob(admin.tenantId, orderId);
    if (!result.ok) {
      const status = result.reason === "not_found" ? 404 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({ ok: true, jobId: result.jobId });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[admin/orders/print]", e);
    return NextResponse.json({ error: "Printjob aanmaken mislukt." }, { status: 500 });
  }
}
