import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requireTenant } from "@/lib/tenant/context";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403
  ) {
    super(message);
  }
}

export type AdminContext = {
  tenantId: string;
  userId: string;
  email: string;
  role: string;
};

export async function requireAdmin(): Promise<AdminContext> {
  const session = await auth();
  const tenant = await requireTenant();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (tenantId && tenantId !== tenant.id) {
    redirect("/admin/login");
  }

  return {
    tenantId: tenant.id,
    userId: session.user.id ?? "",
    email: session.user.email,
    role: (session.user as { role?: string }).role ?? "STAFF",
  };
}

export async function requireAdminApi(): Promise<AdminContext> {
  const session = await auth();
  const tenant = await requireTenant();

  if (!session?.user?.email) {
    throw new AdminAuthError("Unauthorized", 401);
  }

  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (tenantId && tenantId !== tenant.id) {
    throw new AdminAuthError("Forbidden", 403);
  }

  return {
    tenantId: tenant.id,
    userId: session.user.id ?? "",
    email: session.user.email,
    role: (session.user as { role?: string }).role ?? "STAFF",
  };
}
