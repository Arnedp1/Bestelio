import { NextResponse } from "next/server";
import { FulfillmentType } from "@prisma/client";
import { requireTenant } from "@/lib/tenant/context";
import { prisma } from "@/lib/prisma";
import { isOpenOnDate } from "@/lib/hours/is-open";
import {
  ensureSlotInstancesForDate,
  filterSlotsByLeadTime,
  listAvailableSlots,
} from "@/lib/slots/availability";

export async function GET(request: Request) {
  const tenant = await requireTenant();
  const { searchParams } = new URL(request.url);
  const fulfillment = (searchParams.get("fulfillment") ?? "PICKUP") as FulfillmentType;
  const dateStr = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const date = new Date(`${dateStr}T12:00:00`);

  const [hours, exceptions, business] = await Promise.all([
    prisma.openingHour.findMany({ where: { tenantId: tenant.id } }),
    prisma.closingException.findMany({
      where: {
        tenantId: tenant.id,
        date: new Date(`${dateStr}T12:00:00`),
      },
    }),
    prisma.businessSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { orderLeadMinutes: true },
    }),
  ]);

  if (!isOpenOnDate(date, hours, exceptions)) {
    return NextResponse.json({ slots: [] });
  }

  await ensureSlotInstancesForDate({
    tenantId: tenant.id,
    date,
    fulfillment,
  });

  const from = new Date(`${dateStr}T00:00:00`);
  const to = new Date(`${dateStr}T23:59:59`);

  const slots = filterSlotsByLeadTime(
    await listAvailableSlots({
      tenantId: tenant.id,
      fulfillment,
      from,
      to,
    }),
    date,
    business?.orderLeadMinutes ?? 30
  );

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      remaining: s.remaining,
    })),
  });
}
