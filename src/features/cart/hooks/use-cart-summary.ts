"use client";

import { useMemo } from "react";
import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { useCartStore } from "../store/use-cart-store";
import { getCartSummary } from "../utils/get-cart-summary";

export function useCartSummary() {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);
  const selectedShippingQuote = useCheckoutStore((state) => state.selectedShippingQuote);

  return useMemo(
    () => getCartSummary(items, couponCode, selectedShippingQuote?.price ?? null),
    [items, couponCode, selectedShippingQuote],
  );
}
