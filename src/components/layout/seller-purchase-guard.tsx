"use client";

import { useEffect } from "react";
import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { useAuthSession } from "@/hooks/use-auth-session";

export function SellerPurchaseGuard() {
  const { isSeller } = useAuthSession();
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);

  useEffect(() => {
    if (!isSeller) {
      return;
    }

    clearCart();
    resetCheckout();
  }, [clearCart, isSeller, resetCheckout]);

  return null;
}
