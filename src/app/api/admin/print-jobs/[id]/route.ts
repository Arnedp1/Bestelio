import { NextResponse } from "next/server";
import { z } from "zod";
import { assertPrintAgentRequest } from "@/lib/print/agent-auth";
import {
  getPrintJobByTenant,
  markPrintJobDone,
  markPrintJobFailed,
  markPrintJobPrinting,
} from "@/lib/print/jobs";

const patchSchema = z.object({
  status: z.enum(["PRINTING", "DONE", "FAILED"]),
  error: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!assertPrintAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = patchSchema.parse(await request.json());

  const tenantId = request.headers.get("x-print-tenant-id")?.trim() || "";
  const job = tenantId ? await getPrintJobByTenant(id, tenantId) : { id };
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.status === "PRINTING") {
    await markPrintJobPrinting(id);
    return NextResponse.json({ ok: true });
  }

  if (body.status === "DONE") {
    await markPrintJobDone(id);
    return NextResponse.json({ ok: true });
  }

  await markPrintJobFailed(id, body.error ?? "Print mislukt");

  return NextResponse.json({ ok: true });
}
