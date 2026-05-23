"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type AdminPanelOverlayProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function AdminPanelOverlay({
  open,
  title,
  description,
  onClose,
  children,
}: AdminPanelOverlayProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="admin-panel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="admin-overlay-backdrop"
        aria-label="Sluiten"
        onClick={onClose}
      />
      <div className="admin-panel-overlay-panel">
        <header className="admin-overlay-header shrink-0">
          <div className="min-w-0 pr-4">
            <h2 id={titleId} className="text-lg font-bold text-stone-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-stone-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-overlay-close"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </header>
        <div className="admin-panel-overlay-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
