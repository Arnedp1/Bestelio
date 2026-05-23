"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkboxClass, checkboxLabelClass } from "@/components/admin/FormField";
import { toggleProductAvailable } from "../actions";

export function ProductAvailableToggle({
  productId,
  available,
}: {
  productId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(available);
  const [pending, startTransition] = useTransition();

  function handleChange() {
    const next = !checked;
    setChecked(next);
    const formData = new FormData();
    formData.set("id", productId);
    formData.set("available", String(next));
    startTransition(() => {
      void toggleProductAvailable(formData)
        .then(() => router.refresh())
        .catch(() => setChecked(!next));
    });
  }

  return (
    <label className={`${checkboxLabelClass} ${pending ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        className={checkboxClass}
        checked={checked}
        disabled={pending}
        onChange={handleChange}
      />
      <span>Bestelbaar</span>
    </label>
  );
}
