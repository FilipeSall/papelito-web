"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OrderStatusAutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, Math.max(30_000, intervalMs));

    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return null;
}
