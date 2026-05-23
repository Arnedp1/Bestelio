import { prisma } from "@/lib/prisma";
import { getOpenStatus } from "@/lib/hours/is-open";
import { requireTenant } from "@/lib/tenant/context";
import { getStorefrontBrand } from "@/lib/storefront/brand";
import { Header } from "./Header";
import { OpenStatusBanner } from "./OpenStatusBanner";
import { DEFAULT_TAGLINE } from "@/lib/storefront/constants";

export async function StorefrontShell({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  const tenant = await requireTenant();
  const brand = await getStorefrontBrand(tenant.id);
  const now = new Date();
  const [hours, todayExceptions] = await Promise.all([
    prisma.openingHour.findMany({ where: { tenantId: tenant.id } }),
    prisma.closingException.findMany({
      where: {
        tenantId: tenant.id,
        date: new Date(now.toISOString().slice(0, 10)),
      },
    }),
  ]);
  const openStatus = getOpenStatus(now, hours, todayExceptions);

  return (
    <div
      className="mx-auto min-h-screen max-w-4xl"
      style={
        {
          "--brand": brand.primaryColor,
          "--brand-dark": "color-mix(in srgb, var(--brand) 85%, #000)",
          "--brand-light": "color-mix(in srgb, var(--brand) 12%, white)",
          "--brand-glow": "color-mix(in srgb, var(--brand) 30%, transparent)",
        } as React.CSSProperties
      }
    >
      <Header
        brandName={brand.displayName}
        logoUrl={brand.logoUrl}
        tagline={DEFAULT_TAGLINE}
      />
      <OpenStatusBanner status={openStatus} />
      <div className="px-4 pb-12 pt-5 sm:px-6">{children}</div>
      {showFooter && (
        <footer className="border-t border-stone-200 bg-white px-4 py-6 text-center text-xs text-stone-500 sm:px-6">
          <p>{brand.displayName} · Online bestellen</p>
          <p className="mt-1">Powered by Honger</p>
        </footer>
      )}
    </div>
  );
}
