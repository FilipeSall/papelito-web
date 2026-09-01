"use client";

import { useMemo } from "react";
import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { resolveSelectedShipping } from "@/features/checkout/utils/resolve-selected-shipping";
import { useCartStore } from "../store/use-cart-store";
import { getCartSummary } from "../utils/get-cart-summary";

type UseCartSummaryOptions = {
  includeCheckoutShipping?: boolean;
};

export function useCartSummary(
  freeShippingMinimumCents?: number | null,
  { includeCheckoutShipping = false }: UseCartSummaryOptions = {},
) {
  const items = useCartStore((state) => state.items);
  const coupon = useCartStore((state) => state.coupon);
  const pricing = useCartStore((state) => state.pricing);
  const shippingQuote = useCheckoutStore((state) => state.shippingQuote);
  const addressZipCode = useCheckoutStore((state) => state.addressForm.zipCode);

  const selectedShippingQuote = useMemo(
    () =>
      includeCheckoutShipping
        ? resolveSelectedShipping(shippingQuote, addressZipCode)
        : null,
    [shippingQuote, addressZipCode, includeCheckoutShipping],
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
