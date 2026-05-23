"use client";

import { useRef, useState, type ReactNode } from "react";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

const DEFAULT_MESSAGE =
  "Weet je zeker dat je dit wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.";

type ConfirmDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  message?: string;
  title?: string;
  className?: string;
  children: ReactNode;
};

export function ConfirmDeleteForm({
  action,
  message = DEFAULT_MESSAGE,
  title = "Verwijderen?",
  className,
  children,
}: ConfirmDeleteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className={className}
        onSubmit={(e) => {
          if (!confirmedRef.current) {
            e.preventDefault();
            setOpen(true);
            return;
          }
          confirmedRef.current = false;
        }}
      >
        {children}
      </form>

      <ConfirmDeleteDialog
        open={open}
        title={title}
        message={message}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
