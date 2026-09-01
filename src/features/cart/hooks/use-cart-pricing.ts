"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useCheckoutStore } from "@/features/checkout/store/use-checkout-store";
import { resolveSelectedShipping } from "@/features/checkout/utils/resolve-selected-shipping";
import { getCartPricing } from "../services/get-cart-pricing";
import { useCartStore } from "../store/use-cart-store";

type UseCartPricingOptions = {
  includeCheckoutShipping?: boolean;
};

export function useCartPricing({
  includeCheckoutShipping = false,
}: UseCartPricingOptions = {}) {
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.coupon?.code ?? null);
  const applyPricingQuote = useCartStore((state) => state.applyPricingQuote);
  const setPricingError = useCartStore((state) => state.setPricingError);
  const shippingQuote = useCheckoutStore((state) => state.shippingQuote);
  const addressZipCode = useCheckoutStore((state) => state.addressForm.zipCode);
  const [isPricing, setIsPricing] = useState(false);
  const requestSequence = useRef(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fingerprint = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.id}:${item.vendorId}:${item.quantity}:${item.promotionContext ?? ""}`,
        )
        .join("|"),
    [items],
  );
  const shippingSelection = useMemo(() => {
    if (!includeCheckoutShipping) return null;

    const selected = resolveSelectedShipping(shippingQuote, addressZipCode);

    return selected && shippingQuote.quote
      ? {
          destinationCep: shippingQuote.quote.destinationCep,
          selectedCode: selected.code,
        }
      : null;
  }, [addressZipCode, includeCheckoutShipping, shippingQuote]);

  useEffect(() => {
    const sequence = ++requestSequence.current;
    if (!fingerprint) {
      setPricingError(null);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsPricing(true);
      const result = await getCartPricing(itemsRef.current, couponCode, shippingSelection);
      if (sequence !== requestSequence.current) return;

      if (result.ok) {
        applyPricingQuote(result.quote);
      } else {
        setPricingError(result.message);
      }
      setIsPricing(false);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [
    applyPricingQuote,
    couponCode,
    fingerprint,
    setPricingError,
    shippingSelection,
  ]);

  return { isPricing: Boolean(fingerprint) && isPricing };
}
