"use client";

import { useEffect, useState } from "react";
import { getVendorProductCustomization } from "../services/vendor-product-customization-client";

interface OwnDescriptionState {
  productId: string;
  description: string | null;
}

/**
 * Prévia, para o seller logado, da descrição que a loja dele mostra no produto.
 * O valor resolvido no servidor vale direto, sem esperar a sessão do cliente; sem ele, lê a
 * visão privada de gestão quando `enabled`.
 * `loading` fica verdadeiro até haver resposta, para a página não exibir outro texto antes;
 * em falha, `description` é `null` e a página fica com o canônico.
 */
export function useOwnProductDescription(productId: string, enabled: boolean, initial: string | null = null) {
  const [state, setState] = useState<OwnDescriptionState | null>(null);
  const id = Number(productId);
  const active = enabled && Number.isSafeInteger(id) && id > 0 && initial === null;

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

  if (initial !== null) return { description: initial, loading: false };
  const current = active && state?.productId === productId ? state : null;
  return { description: current?.description ?? null, loading: active && current === null };
}
