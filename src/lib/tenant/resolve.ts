import { prisma } from "@/lib/prisma";
import type { ResolvedTenant } from "./types";

function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase();
}

async function domainForHost(hostname: string) {
  return prisma.tenantDomain.findUnique({
    where: { hostname },
    include: { tenant: true },
  });
}

export async function resolveTenantByHost(
  host: string
): Promise<ResolvedTenant | null> {
  const hostname = normalizeHost(host);

  let domain = await domainForHost(hostname);

  // Local dev: 127.0.0.1 and other hosts often lack a DB row; fall back to DEFAULT_TENANT_HOST.
  if (
    !domain?.tenant.isActive &&
    process.env.NODE_ENV === "development" &&
    hostname !== normalizeHost(process.env.DEFAULT_TENANT_HOST ?? "localhost")
  ) {
    domain = await domainForHost(
      normalizeHost(process.env.DEFAULT_TENANT_HOST ?? "localhost")
    );
  }

  if (!domain?.tenant.isActive) return null;

  return {
    id: domain.tenant.id,
    slug: domain.tenant.slug,
    name: domain.tenant.name,
  };
}
