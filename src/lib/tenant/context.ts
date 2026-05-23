import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ResolvedTenant } from "./types";
import { resolveTenantByHost } from "./resolve";

const TENANT_HOST_HEADER = "x-tenant-host";

function hostFromRequestHeaders(h: Headers): string {
  const raw =
    h.get(TENANT_HOST_HEADER) ??
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.DEFAULT_TENANT_HOST ??
    "localhost";
  return raw.split(":")[0].toLowerCase();
}

/** Resolves tenant on Node.js runtime (Prisma). Cached per request. */
export const resolveTenant = cache(async (): Promise<ResolvedTenant | null> => {
  const h = await headers();
  const host = hostFromRequestHeaders(h);
  return resolveTenantByHost(host);
});

export async function getTenant(): Promise<ResolvedTenant | null> {
  return resolveTenant();
}

export async function requireTenant(): Promise<ResolvedTenant> {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  return tenant;
}
