import "../admin.css";
import { requireTenant } from "@/lib/tenant/context";
import { getStorefrontBrand } from "@/lib/storefront/brand";
import { AdminLoginForm } from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const tenant = await requireTenant();
  const brand = await getStorefrontBrand(tenant.id);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-1/2 flex-col justify-between bg-stone-900 p-12 text-white lg:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Honger</p>
          <h1 className="mt-4 text-3xl font-bold">{brand.displayName}</h1>
          <p className="mt-2 max-w-sm text-stone-400">
            Beheer bestellingen, menu en instellingen vanuit één overzichtelijk portaal.
          </p>
        </div>
        <p className="text-sm text-stone-600">© Honger Platform</p>
      </aside>
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-3xl">🍟</span>
            <h1 className="mt-2 text-xl font-bold text-stone-900">{brand.displayName}</h1>
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Inloggen</h2>
          <p className="mt-1 text-sm text-stone-500">Alleen voor bevoegde medewerkers</p>
          <div className="admin-card mt-6 p-6">
            <AdminLoginForm tenantId={tenant.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
