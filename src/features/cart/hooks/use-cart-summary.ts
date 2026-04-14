"use client";

import { useMemo } from "react";
import { useCartStore } from "../store/use-cart-store";
import { getCartSummary } from "../utils/get-cart-summary";

export function useCartSummary() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);

  return useMemo(
    () => getCartSummary(items, couponCode),
    [items, couponCode],
  );
}
