"use client";

import { useEffect, useRef } from "react";

import { useCartStore } from "../store/use-cart-store";

type RevalidationHandler = (params: {
  removed: boolean;
  reason?: string;
  code: string | null;
}) => void;

function itemsFingerprint(items: ReturnType<typeof useCartStore.getState>["items"]) {
  return items
    .map((item) => `${item.id}:${item.vendorId}:${item.quantity}:${item.price}`)
    .join("|");
}

export function useCartCouponRevalidator(onResult?: RevalidationHandler) {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.coupon?.code ?? null);
  const revalidateCoupon = useCartStore((state) => state.revalidateCoupon);

  const lastFingerprintRef = useRef<string | null>(null);
  const lastCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!couponCode) {
      lastFingerprintRef.current = null;
      lastCodeRef.current = null;
      return;
    }

    const fingerprint = itemsFingerprint(items);
    const codeChanged = lastCodeRef.current !== couponCode;
    const itemsChanged = lastFingerprintRef.current !== fingerprint;

    if (!codeChanged && !itemsChanged) {
      return;
    }

    lastFingerprintRef.current = fingerprint;
    lastCodeRef.current = couponCode;

    if (codeChanged && !itemsChanged) {
      return;
    }

    const timeout = window.setTimeout(() => {
      revalidateCoupon().then((result) => {
        if (!result.revalidated) return;
        onResult?.({
          removed: result.removed,
          reason: result.reason,
          code: couponCode,
        });
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [items, couponCode, revalidateCoupon, onResult]);
}
