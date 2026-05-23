"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      tenantId,
      redirect: false,
    });
    if (res?.error) {
      setError("Ongeldige inloggegevens.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">E-mail</span>
        <input
          name="email"
          type="email"
          required
          defaultValue="admin@demo.local"
          className="input-field mt-1"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Wachtwoord</span>
        <input name="password" type="password" required className="input-field mt-1" />
      </label>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button type="submit" className="btn-primary w-full">
        Inloggen
      </button>
    </form>
  );
}
