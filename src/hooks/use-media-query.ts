"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Assina uma media query.
 *
 * `useSyncExternalStore` em vez de ler no efeito: o efeito chamava `setState` no corpo, o que
 * dispara render em cascata, e além disso não reagia a redimensionamento.
 * No servidor e sem `matchMedia` o resultado é `false` — o estado mais estreito.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => undefined;

      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
