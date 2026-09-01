"use client";

import { useMemo } from "react";
import { useCartStore } from "@/features/cart";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useCheckoutStore } from "../store/use-checkout-store";
import {
  getCheckoutStepAccess,
  type CheckoutStepAccess,
} from "../utils/checkout-step-access";

const SERVER_STEP_ACCESS: CheckoutStepAccess = { 1: true, 2: false, 3: false };

/**
 * Etapas navegáveis do checkout. Antes da hidratação a store persistida ainda não
 * foi lida, então só a etapa atual responde — evita marcar como alcançável uma
 * etapa que o HTML do servidor não conhecia.
 */
export function useCheckoutStepAccess(): CheckoutStepAccess {
  const isMounted = useIsMounted();
  const items = useCartStore((state) => state.items);
  const addressForm = useCheckoutStore((state) => state.addressForm);
  const selectedShippingOption = useCheckoutStore(
    (state) => state.shippingQuote.selectedOption,
  );
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod);
  const paymentForm = useCheckoutStore((state) => state.paymentForm);

  return useMemo(() => {
    if (!isMounted) return SERVER_STEP_ACCESS;

    return getCheckoutStepAccess({
      items,
      addressForm,
      selectedShippingOption,
      paymentMethod,
      paymentForm,
    });
  }, [
    addressForm,
    isMounted,
    items,
    paymentForm,
    paymentMethod,
    selectedShippingOption,
  ]);
}
