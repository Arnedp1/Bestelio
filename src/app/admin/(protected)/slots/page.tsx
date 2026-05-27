import { FulfillmentType, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { ensureSlotInstancesForDate } from "@/lib/slots/availability";
import { consolidateTimeSlotRules } from "@/lib/slots/consolidate-rules";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { TimeSlotRule } from "@prisma/client";
import { SlotsFulfillmentColumn } from "./SlotsFulfillmentColumn";

function primaryRule(rules: TimeSlotRule[]) {
  return rules[0] ?? null;
}

export default async function AdminSlotsPage() {
  const { tenantId } = await requireAdmin();
  await consolidateTimeSlotRules(tenantId);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  await ensureSlotInstancesForDate({
    tenantId,
    date: today,
    fulfillment: FulfillmentType.PICKUP,
  });
  await ensureSlotInstancesForDate({
    tenantId,
    date: today,
    fulfillment: FulfillmentType.DELIVERY,
  });

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const [rules, instances] = await Promise.all([
    prisma.timeSlotRule.findMany({
      where: { tenantId },
      orderBy: [{ fulfillment: "asc" }, { startTime: "asc" }],
    }),
    prisma.timeSlotInstance.findMany({
      where: { tenantId, startsAt: { gte: start, lte: end } },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  const slotIds = instances.map((row) => row.id);
  const revenueBySlot =
    slotIds.length === 0
      ? new Map<string, number>()
      : new Map(
          (
            await prisma.order.groupBy({
              by: ["timeSlotInstanceId"],
              where: {
                tenantId,
                timeSlotInstanceId: { in: slotIds },
                status: { not: OrderStatus.CANCELLED },
              },
              _sum: { totalCents: true },
            })
          )
            .filter((row) => row.timeSlotInstanceId)
            .map((row) => [row.timeSlotInstanceId as string, row._sum.totalCents ?? 0])
        );

  const pickupRules = rules.filter((r) => r.fulfillment === FulfillmentType.PICKUP);
  const deliveryRules = rules.filter((r) => r.fulfillment === FulfillmentType.DELIVERY);
  const pickupToday = instances
    .filter((i) => i.fulfillment === FulfillmentType.PICKUP)
    .map((row) => ({
      ...row,
      maxRevenueCents: row.maxOrders,
      bookedRevenueCents: revenueBySlot.get(row.id) ?? 0,
    }));
  const deliveryToday = instances
    .filter((i) => i.fulfillment === FulfillmentType.DELIVERY)
    .map((row) => ({
      ...row,
      maxRevenueCents: row.maxOrders,
      bookedRevenueCents: revenueBySlot.get(row.id) ?? 0,
    }));

  const dateLabel = today.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tijdslots"
        description="Eén planning per type: afhalen en leveren apart instellen, daaronder de slots van vandaag"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SlotsFulfillmentColumn
          title="Afhalen"
          fulfillment={FulfillmentType.PICKUP}
          rule={primaryRule(pickupRules)}
          todayRows={pickupToday}
          dateHint={dateLabel}
        />
        <SlotsFulfillmentColumn
          title="Leveren"
          fulfillment={FulfillmentType.DELIVERY}
          rule={primaryRule(deliveryRules)}
          todayRows={deliveryToday}
          dateHint={dateLabel}
        />
      </div>
    </div>
  );
}
