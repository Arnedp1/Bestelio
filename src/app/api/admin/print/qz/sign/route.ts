import { NextResponse } from "next/server";
import { z } from "zod";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { signQzMessage } from "@/lib/print/qz-signing";

const schema = z.object({
  data: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = schema.parse(await request.json());
    const signature = signQzMessage(body.data);
    if (!signature) {
      return NextResponse.json(
        { ok: false, error: "QZ_TRAY_PRIVATE_KEY_PEM ontbreekt in env." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, signature });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "QZ signing mislukt." }, { status: 500 });
  }
}

