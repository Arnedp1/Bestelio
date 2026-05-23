"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { btnDanger, btnSecondary } from "./FormField";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title = "Verwijderen?",
  message,
  confirmLabel = "Ja, verwijderen",
  cancelLabel = "Annuleren",
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="admin-confirm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-desc`}
    >
      <button
        type="button"
        className="admin-overlay-backdrop"
        aria-label={cancelLabel}
        onClick={onCancel}
      />
      <div className="admin-confirm-panel">
        <h2 id={titleId} className="text-lg font-bold text-stone-900">
          {title}
        </h2>
        <p id={`${titleId}-desc`} className="mt-2 text-sm leading-relaxed text-stone-600">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${btnDanger} !border-red-300 !bg-red-600 !px-4 !py-2 !text-white hover:!bg-red-700`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
