"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; icon: string; exact?: boolean };

const SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "Operatie",
    links: [
      { href: "/admin/orders", label: "Bestellingen", icon: "📋", exact: true },
      { href: "/admin/orders/ingave", label: "Bestelling ingave", icon: "🧾", exact: true },
    ],
  },
  {
    title: "Catalogus",
    links: [
      { href: "/admin/products", label: "Producten", icon: "🍔" },
      { href: "/admin/categories", label: "Categorieën", icon: "📁" },
    ],
  },
  {
    title: "Planning",
    links: [
      { href: "/admin/hours", label: "Openingstijden", icon: "🕐" },
      { href: "/admin/slots", label: "Tijdslots", icon: "⏱️" },
    ],
  },
  {
    title: "Systeem",
    links: [{ href: "/admin/settings", label: "Instellingen", icon: "⚙️" }],
  },
];

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  const path = normalizePath(pathname);
  const target = normalizePath(href);

  // Keep orders and order-entry mutually exclusive at all times.
  if (target === "/admin/orders") {
    return path === "/admin/orders";
  }
  if (target === "/admin/orders/ingave") {
    return path === "/admin/orders/ingave";
  }

  if (exact) return path === target;
  return path === target || path.startsWith(`${target}/`);
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col p-3">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.links.map((l) => {
              const active = isActive(pathname, l.href, l.exact);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-orange-600 text-white shadow-md shadow-orange-900/30"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <span className="text-base opacity-90">{l.icon}</span>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto border-t border-stone-700 pt-3">
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white"
        >
          <span>↗</span>
          Bekijk webshop
        </Link>
      </div>
    </nav>
  );
}
