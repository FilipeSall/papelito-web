"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OrderStatusAutoRefresh({
  active = true,
  intervalMs = 60_000,
  maxAttempts = 8,
}: {
  active?: boolean;
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return undefined;

    let attempt = 0;
    let timer: number | undefined;

    function schedule() {
      const baseDelay = Math.max(10_000, intervalMs);
      const delay = Math.min(120_000, baseDelay * 2 ** Math.max(0, attempt - 1));
      const jitter = Math.round(delay * (Math.random() * 0.2 - 0.1));
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") router.refresh();
        attempt += 1;
        if (attempt < maxAttempts) schedule();
      }, delay + jitter);
    }

    schedule();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [active, intervalMs, maxAttempts, router]);

  return null;
}
