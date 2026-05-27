import { requireTenant } from "@/lib/tenant/context";
import { getAdminOrdersSnapshot } from "@/lib/admin/orders";
import { OrdersLivePanel } from "../OrdersLivePanel";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const tenant = await requireTenant();
  const snapshot = await getAdminOrdersSnapshot(tenant.id);

  return <OrdersLivePanel initial={snapshot} />;
}
