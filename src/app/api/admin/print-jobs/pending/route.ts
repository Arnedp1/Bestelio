import { NextResponse } from "next/server";
import { assertPrintAgentRequest } from "@/lib/print/agent-auth";
import { buildEscposBase64ForJob } from "@/lib/print/build-job-escpos";
import { listPendingPrintJobs } from "@/lib/print/jobs";

export async function GET(request: Request) {
  if (!assertPrintAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? "5")));
  const tenantId = url.searchParams.get("tenantId")?.trim() || undefined;

  const jobs = await listPendingPrintJobs(limit, tenantId);

  const items = jobs.map((job) => {
    const built = buildEscposBase64ForJob(job.type, job.payload);
    const escposBase64 = built.ok ? built.base64 : null;
    return {
      id: job.id,
      tenantId: job.tenantId,
      orderId: job.orderId,
      type: job.type,
      createdAt: job.createdAt.toISOString(),
      payload: job.payload,
      escposBase64,
    };
  });

  return NextResponse.json({ jobs: items });
}
