"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminOverlay({
  title,
  description,
  closeHref,
  children,
}: {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function close() {
    router.push(closeHref);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.push(closeHref);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [closeHref, router]);

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-overlay-title">
      <button
        type="button"
        className="admin-overlay-backdrop"
        aria-label="Sluiten"
        onClick={close}
      />
      <div className="admin-overlay-panel">
        <header className="admin-overlay-header">
          <div className="min-w-0 pr-4">
            <h2 id="admin-overlay-title" className="truncate text-lg font-bold text-stone-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 truncate text-sm text-stone-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            className="admin-overlay-close"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </header>
        <div className="admin-overlay-body">{children}</div>
      </div>
    </div>
  );
}
