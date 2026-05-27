import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { getQzCertificatePem } from "@/lib/print/qz-signing";

export async function GET() {
  try {
    await requireAdminApi();
    const cert = getQzCertificatePem();
    if (!cert) {
      return NextResponse.json(
        { ok: false, error: "QZ_TRAY_CERT_PEM ontbreekt in env." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, certificate: cert });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Kon QZ certificaat niet laden." }, { status: 500 });
  }
}

