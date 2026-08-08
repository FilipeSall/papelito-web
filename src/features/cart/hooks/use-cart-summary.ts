"use client";

import { useMemo } from "react";
import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { useCartStore } from "../store/use-cart-store";
import { getCartSummary } from "../utils/get-cart-summary";

export function useCartSummary(freeShippingMinimumCents?: number | null) {
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  const pricing = useCartStore((state) => state.pricing);
  const selectedShippingQuote = useCheckoutStore(
    (state) => state.shippingQuote.selectedOption,
  );

  return useMemo(
    () =>
      getCartSummary(
        items,
        coupon,
        selectedShippingQuote?.price ?? null,
        pricing,
        freeShippingMinimumCents,
      ),
    [items, coupon, selectedShippingQuote, pricing, freeShippingMinimumCents],
  );
}
