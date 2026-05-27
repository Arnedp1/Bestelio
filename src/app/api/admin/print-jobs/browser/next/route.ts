import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { buildEscposBase64ForJob } from "@/lib/print/build-job-escpos";
import { claimNextPendingPrintJob, markPrintJobFailed } from "@/lib/print/jobs";

async function claimNextPending(tenantId: string) {
  return claimNextPendingPrintJob(tenantId);
}

export async function POST() {
  try {
    const admin = await requireAdminApi();
    const job = await claimNextPending(admin.tenantId);

    if (!job) {
      return NextResponse.json({ ok: true, job: null });
    }

    const built = buildEscposBase64ForJob(job.type, job.payload);
    if (!built.ok) {
      await markPrintJobFailed(job.id, built.error);
      return NextResponse.json({ ok: true, job: null });
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        orderId: job.orderId,
        orderNumber: built.orderNumber,
        escposBase64: built.base64,
      },
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[print-jobs/browser/next]", e);
    return NextResponse.json({ error: "Kan printjob niet claimen." }, { status: 500 });
  }
}

