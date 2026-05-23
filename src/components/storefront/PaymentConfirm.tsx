"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const POLL_MS = 2000;
const MAX_ATTEMPTS = 20;

export function PaymentConfirm({
  orderId,
  paymentStatus,
  hasOnlinePayment,
}: {
  orderId: string;
  paymentStatus: string | null;
  hasOnlinePayment: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!hasOnlinePayment || paymentStatus === "PAID") return;
    if (ranRef.current) return;

    const fromReturn =
      params.get("payment") === "simulated" || params.get("payment") === "return";
    const shouldPoll = fromReturn || paymentStatus === "PENDING";

    if (!shouldPoll) return;

    ranRef.current = true;
    let cancelled = false;

    async function confirmOnce(): Promise<string> {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        cache: "no-store",
      });
      if (!res.ok) return paymentStatus ?? "PENDING";
      const data = (await res.json()) as { status?: string };
      return data.status ?? "PENDING";
    }

    async function run() {
      setBusy(true);
      setMessage("Betaling controleren…");

      for (let i = 0; i < MAX_ATTEMPTS && !cancelled; i++) {
        const status = await confirmOnce();
        if (status === "PAID") {
          router.refresh();
          setMessage(null);
          setBusy(false);
          return;
        }
        if (status === "FAILED") {
          setMessage("Betaling mislukt of geannuleerd. Probeer opnieuw via afhalen/betalen.");
          setBusy(false);
          router.refresh();
          return;
        }
        if (i < MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, POLL_MS));
        }
      }

      setMessage(
        "Betaling nog niet bevestigd. Vernieuw de pagina over een ogenblik of neem contact op met de zaak."
      );
      setBusy(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [orderId, paymentStatus, hasOnlinePayment, params, router]);

  if (!message && !busy) return null;

  return (
    <p
      className={`mb-4 text-center text-sm ${busy ? "text-stone-500" : "text-amber-700"}`}
      role="status"
    >
      {message}
    </p>
  );
}
