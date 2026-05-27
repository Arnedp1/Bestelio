import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import {
  getPrintJobByTenant,
  markPrintJobDone,
  markPrintJobFailed,
} from "@/lib/print/jobs";

const schema = z.object({
  jobId: z.string().cuid(),
  success: z.boolean(),
  error: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const body = schema.parse(await request.json());

    const job = await getPrintJobByTenant(body.jobId, admin.tenantId);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.success) {
      await markPrintJobDone(body.jobId);
      return NextResponse.json({ ok: true });
    }

    await markPrintJobFailed(body.jobId, body.error ?? "Printen mislukt in QZ Tray");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error("[print-jobs/browser/complete]", e);
    return NextResponse.json({ error: "Kan printstatus niet opslaan." }, { status: 500 });
  }
}

