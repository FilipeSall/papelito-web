"use client";

import { useEffect, useState } from "react";
import { getVendorProductCustomization } from "../services/vendor-product-customization-client";

interface OwnDescriptionState {
  productId: string;
  description: string | null;
}

/**
 * Prévia, para o seller logado, da descrição que a loja dele mostra no produto.
 * Lê a visão privada de gestão, que não depende de o vendor estar apto a vender;
 * devolve `null` enquanto carrega, quando desligado ou em falha (a página fica com o canônico).
 */
export function useOwnProductDescription(productId: string, enabled: boolean) {
  const [state, setState] = useState<OwnDescriptionState | null>(null);
  const id = Number(productId);
  const active = enabled && Number.isSafeInteger(id) && id > 0;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    getVendorProductCustomization(id, controller.signal).then((view) => {
      if (!controller.signal.aborted) setState({ productId, description: view.effectiveDescription });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ productId, description: null });
    });
    return () => controller.abort();
  }, [active, id, productId]);

  const current = active && state?.productId === productId ? state : null;
  return { description: current?.description ?? null, loading: active && current === null };
}
