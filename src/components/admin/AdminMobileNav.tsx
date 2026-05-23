"use client";

import { useState } from "react";
import { AdminNav } from "./AdminNav";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium lg:hidden"
      >
        ☰ Menu
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/60"
            aria-label="Sluit menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-stone-900">
            <div className="flex items-center justify-between border-b border-stone-700 px-4 py-4">
              <span className="font-bold text-white">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
