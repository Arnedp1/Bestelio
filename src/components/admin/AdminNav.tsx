"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; icon: string; exact?: boolean };

const SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: "Operatie",
    links: [{ href: "/admin", label: "Bestellingen", icon: "📋", exact: true }],
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

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
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
