"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/features/cart/store/use-cart-store";
import type { ActiveVendor } from "@/features/active-vendor/types/active-vendor";

function subscribeHydration(listener: () => void) {
  const unsubscribeStart = useCartStore.persist.onHydrate(listener);
  const unsubscribeFinish = useCartStore.persist.onFinishHydration(listener);
  return () => { unsubscribeStart(); unsubscribeFinish(); };
}

function hasHydrated() { return useCartStore.persist.hasHydrated(); }
function serverHasHydrated() { return false; }

/** Confirma o carrinho persistido antes de aplicar a preferência da conta ao texto. */
export function useProductVendorContext(activeVendor: ActiveVendor | null, enabled: boolean) {
  const hydrated = useSyncExternalStore(subscribeHydration, hasHydrated, serverHasHydrated);
  const items = useCartStore((state) => state.items);
  const first = items[0];
  const validCart = first !== undefined && items.every((item) => item.vendorId === first.vendorId);
  if (!enabled || !hydrated) {
    return { hydrated, vendorId: null, vendorName: "", fromCart: false };
  }
  if (validCart) {
    return { hydrated, vendorId: first.vendorId, vendorName: first.vendorName, fromCart: true };
  }
  return {
    hydrated, vendorId: activeVendor?.vendorId ?? null,
    vendorName: activeVendor?.storeName ?? "", fromCart: false,
  };
}
