import type { TimeSlotRule } from "@prisma/client";
import type { FulfillmentType } from "@prisma/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { SlotRuleForm } from "./SlotRuleForm";
import { SlotsTodaySection } from "./SlotsTodaySection";

type TodayRow = {
  id: string;
  startsAt: Date;
  maxRevenueCents: number;
  bookedRevenueCents: number;
  isBlocked: boolean;
};

export function SlotsFulfillmentColumn({
  title,
  fulfillment,
  rule,
  todayRows,
  dateHint,
}: {
  title: string;
  fulfillment: FulfillmentType;
  rule: TimeSlotRule | null;
  todayRows: TodayRow[];
  dateHint: string;
}) {
  const status = !rule ? "Nog niet ingesteld" : rule.isActive ? "Actief" : "Uitgeschakeld";

  return (
    <AdminCard
      title={title}
      description={`${status} · ${dateHint}`}
      className="min-w-0"
    >
      <div className="space-y-6">
        <SlotRuleForm fulfillment={fulfillment} rule={rule} />
        <div className="border-t border-stone-100 pt-5">
          <SlotsTodaySection title="Vandaag" rows={todayRows} showHeading />
        </div>
      </div>
    </AdminCard>
  );
}
