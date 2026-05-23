import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { AdminAuthError, requireAdminApi } from "@/lib/admin/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi();
    const { id } = await params;
    const body = schema.parse(await request.json());

    const order = await prisma.order.updateMany({
      where: { id, tenantId: admin.tenantId },
      data: { status: body.status },
    });

    if (order.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
