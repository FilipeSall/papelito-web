"use client";

import { useEffect, useRef } from "react";

import { pushEcommerceEvent } from "./data-layer";
import type { Ga4EcommerceEventName, Ga4Item } from "./ga4-ecommerce";

/**
 * Publica um evento de ecommerce uma única vez por `key`.
 *
 * Sem a guarda, cada re-render da página de produto emitiria outro `view_item` e o relatório
 * contaria visualizações que não existiram. A `key` troca quando muda o que está sendo observado
 * (outro produto, outro carrinho), e só então o evento volta a disparar.
 */
export function useEcommerceEventOnce(
  event: Ga4EcommerceEventName,
  items: readonly Ga4Item[],
  key: string | null,
): void {
  const firedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!key || items.length === 0 || firedKey.current === key) {
      return;
    }

    firedKey.current = key;
    pushEcommerceEvent(event, items);
  }, [event, items, key]);
}
