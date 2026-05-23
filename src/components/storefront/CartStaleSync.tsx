"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncCartCookie } from "@/app/cart/actions";

export function CartStaleSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void syncCartCookie().then(() => router.refresh());
  }, [router]);

  return null;
}
