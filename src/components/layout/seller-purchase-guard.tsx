"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { useAuthSession } from "@/hooks/use-auth-session";

export function SellerPurchaseGuard() {
  const { isAdministrator, isSeller } = useAuthSession();
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const isPurchaseBlockedByRole = isAdministrator || isSeller;

  useEffect(() => {
    if (!isPurchaseBlockedByRole) {
      return;
    }

    clearCart();
    resetCheckout();
  }, [clearCart, isPurchaseBlockedByRole, resetCheckout]);

  return null;
}
