import { OrderStatus, type FulfillmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isoDateFromDate } from "@/lib/dates/calendar";
import { isOpenOnDate } from "@/lib/hours/is-open";
import { slotRemaining } from "@/lib/slots/capacity";

export type AvailableSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  fulfillment: FulfillmentType;
  maxRevenueCents: number;
  bookedRevenueCents: number;
  remaining: number;
};

export async function listAvailableSlots(params: {
  tenantId: string;
  fulfillment: FulfillmentType;
  from: Date;
  to: Date;
}): Promise<AvailableSlot[]> {
  const instances = await prisma.timeSlotInstance.findMany({
    where: {
      tenantId: params.tenantId,
      fulfillment: params.fulfillment,
      isBlocked: false,
      startsAt: { gte: params.from, lte: params.to },
    },
    orderBy: { startsAt: "asc" },
  });

  const slotIds = instances.map((s) => s.id);
  const revenueBySlot =
    slotIds.length === 0
      ? new Map<string, number>()
      : new Map(
          (
            await prisma.order.groupBy({
              by: ["timeSlotInstanceId"],
              where: {
                tenantId: params.tenantId,
                timeSlotInstanceId: { in: slotIds },
                status: { not: OrderStatus.CANCELLED },
              },
              _sum: { totalCents: true },
            })
          )
            .filter((row) => row.timeSlotInstanceId)
            .map((row) => [row.timeSlotInstanceId as string, row._sum.totalCents ?? 0])
        );

  return instances.map((s) => {
    const bookedRevenueCents = revenueBySlot.get(s.id) ?? 0;
    return {
      id: s.id,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      fulfillment: s.fulfillment,
      maxRevenueCents: s.maxOrders,
      bookedRevenueCents,
      remaining: slotRemaining(s.maxOrders, bookedRevenueCents),
    };
  });
}

/** Verberg slots die te snel starten (instelling «Vooruitbestellen» in admin). */
export function filterSlotsByLeadTime(
  slots: AvailableSlot[],
  date: Date,
  leadMinutes: number
): AvailableSlot[] {
  if (isoDateFromDate(date) !== isoDateFromDate(new Date())) return slots;
  const cutoff = Date.now() + leadMinutes * 60_000;
  return slots.filter((s) => s.startsAt.getTime() >= cutoff);
}

export async function getNextAvailableSlot(params: {
  tenantId: string;
  fulfillment: FulfillmentType;
  after: Date;
  excludeId?: string;
}): Promise<AvailableSlot | null> {
  const to = new Date(params.after);
  to.setDate(to.getDate() + 7);

  const slots = await listAvailableSlots({
    tenantId: params.tenantId,
    fulfillment: params.fulfillment,
    from: params.after,
    to,
  });

  const filtered = params.excludeId
    ? slots.filter((s) => s.id !== params.excludeId)
    : slots;

  return filtered[0] ?? null;
}

export async function ensureSlotInstancesForDate(params: {
  tenantId: string;
  date: Date;
  fulfillment: FulfillmentType;
}): Promise<void> {
  const [hours, exceptions] = await Promise.all([
    prisma.openingHour.findMany({ where: { tenantId: params.tenantId } }),
    prisma.closingException.findMany({
      where: {
        tenantId: params.tenantId,
        date: new Date(params.date.toISOString().slice(0, 10)),
      },
    }),
  ]);

  if (!isOpenOnDate(params.date, hours, exceptions)) return;

  const day = params.date.getDay();
  const rules = await prisma.timeSlotRule.findMany({
    where: {
      tenantId: params.tenantId,
      fulfillment: params.fulfillment,
      isActive: true,
      OR: [{ dayOfWeek: null }, { dayOfWeek: day }],
    },
  });

  for (const rule of rules) {
    const [sh, sm] = rule.startTime.split(":").map(Number);
    const [eh, em] = rule.endTime.split(":").map(Number);
    const windowStart = new Date(params.date);
    windowStart.setHours(sh, sm, 0, 0);
    const windowEnd = new Date(params.date);
    windowEnd.setHours(eh, em, 0, 0);

    let cursor = new Date(windowStart);
    while (cursor < windowEnd) {
      const endsAt = new Date(cursor.getTime() + rule.intervalMinutes * 60_000);
      if (endsAt > windowEnd) break;

      await prisma.timeSlotInstance.upsert({
        where: {
          tenantId_fulfillment_startsAt: {
            tenantId: params.tenantId,
            fulfillment: params.fulfillment,
            startsAt: cursor,
          },
        },
        create: {
          tenantId: params.tenantId,
          fulfillment: params.fulfillment,
          startsAt: cursor,
          endsAt,
          maxOrders: rule.maxOrders,
        },
        update: {
          endsAt,
          maxOrders: rule.maxOrders,
        },
      });

      cursor = endsAt;
    }
  }
}
