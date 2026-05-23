import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { getAdminOrdersSnapshot } from "@/lib/admin/orders";

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
