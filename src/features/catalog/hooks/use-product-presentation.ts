"use client";

import { useEffect, useRef, useState } from "react";
import { getProductPresentationClient } from "../services/product-presentation-client";
import type { ProductPresentation } from "../types/product-presentation";

interface PresentationState {
  key: string;
  presentation: ProductPresentation | null;
  error: string | null;
  loading: boolean;
}

/** Isola cada par produto/vendor e cancela requisições de contextos anteriores. */
export function useProductPresentation(
  productId: string, vendorId: number | null, initial: ProductPresentation | null = null, enabled = true,
) {
  const key = productId + ":" + vendorId;
  const initialMatches = initial?.productId === Number(productId) && initial.vendorId === vendorId;
  const [state, setState] = useState<PresentationState | null>(null);
  const [reload, setReload] = useState(0);
  const active = enabled && vendorId !== null;
  const initialContext = useRef<{ key: string; changed: boolean } | null>(null);

  useEffect(() => {
    if (!enabled || vendorId === null) return;
    initialContext.current ??= { key, changed: false };
    if (initialContext.current.key !== key) initialContext.current.changed = true;
    if (initialMatches && !initialContext.current.changed && reload === 0) return;
    const controller = new AbortController();
    getProductPresentationClient(productId, vendorId, controller.signal).then((presentation) => {
      if (!controller.signal.aborted) setState({ key, presentation, error: null, loading: false });
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setState({
        key, presentation: null, loading: false,
        error: cause instanceof Error ? cause.message : "A descrição do vendor está indisponível.",
      });
    });
    return () => controller.abort();
  }, [productId, vendorId, enabled, key, reload, initialMatches]);

  const current = active && state?.key === key ? state : null;
  let presentation: ProductPresentation | null = null;
  if (active && !current?.error) {
    presentation = current?.presentation ?? (initialMatches ? initial : null);
  }
  return {
    presentation,
    error: current?.error ?? null,
    loading: active && (current?.loading ?? !initialMatches),
    retry: () => {
      setState(null);
      setReload((value) => value + 1);
    },
  };
}
