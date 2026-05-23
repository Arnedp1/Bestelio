import "../admin.css";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin/session";
import { requireTenant } from "@/lib/tenant/context";
import { getStorefrontBrand } from "@/lib/storefront/brand";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const tenant = await requireTenant();
  const brand = await getStorefrontBrand(tenant.id);

  return (
    <div className="admin-root flex min-h-screen bg-stone-100">
      <aside className="admin-sidebar hidden w-64 shrink-0 flex-col self-start bg-stone-900 lg:flex">
        <div className="shrink-0 border-b border-stone-800 px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Honger Admin
          </p>
          <p className="mt-1 truncate text-base font-bold text-white">{brand.displayName}</p>
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <AdminMobileNav />
            <div>
              <p className="text-xs font-medium text-stone-400 lg:hidden">{brand.displayName}</p>
              <p className="hidden text-sm text-stone-600 lg:block">
                Beheerportaal · <span className="font-medium text-stone-900">{tenant.name}</span>
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
            >
              Uitloggen
            </button>
          </form>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-6xl admin-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
