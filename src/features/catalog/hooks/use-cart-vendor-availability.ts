"use client";

import { useEffect, useState } from "react";
import { createRegionBlock, type RegionBlock } from "../types/region-block";

interface AvailabilityState {
  key: string;
  stockQty: number | null;
  regionBlock: RegionBlock | null;
  error: string | null;
}

function parseAvailability(value: unknown, productId: string) {
  if (!value || typeof value !== "object" || !("status" in value)) throw new Error("Resposta inválida.");
  if (value.status === "missing_cep") return { stockQty: null, regionBlock: createRegionBlock("missing_cep") };
  if (value.status === "no_vendor") return { stockQty: 0, regionBlock: createRegionBlock("no_vendor") };
  if (value.status !== "ok" || !("products" in value) || !value.products || typeof value.products !== "object") throw new Error("Disponibilidade indisponível.");
  const entry: unknown = Reflect.get(value.products, productId);
  if (!entry || typeof entry !== "object" || !("available" in entry) || typeof entry.available !== "boolean" || !("stockQty" in entry) || typeof entry.stockQty !== "number" || !Number.isFinite(entry.stockQty) || entry.stockQty < 0) throw new Error("Saldo indisponível.");
  return { stockQty: entry.stockQty, regionBlock: entry.available ? null : createRegionBlock("no_product_coverage") };
}

/**
 * Confirma a disponibilidade do vendor do carrinho pelo CEP efetivo da conta.
 * Bloqueia a compra durante a consulta ou em erro; respostas de outro contexto são descartadas.
 */
export function useCartVendorAvailability(productId: string, vendorId: number | null, enabled: boolean) {
  const [state, setState] = useState<AvailabilityState | null>(null);
  const [revision, setRevision] = useState(0);
  const key = `${productId}:${vendorId}:${revision}`;
  useEffect(() => {
    if (!enabled || vendorId === null) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ productIds: productId, vendorId: String(vendorId) });
    fetch(`/api/catalog/availability?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Consulta indisponível.");
        return parseAvailability(await response.json(), productId);
      })
      .then((availability) => {
        if (!controller.signal.aborted) setState({ key, ...availability, error: null });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, stockQty: null, regionBlock: null, error: "Não foi possível verificar a disponibilidade do vendor do carrinho." });
      });
    return () => controller.abort();
  }, [productId, vendorId, enabled, key]);
  const current = enabled && state?.key === key ? state : null;
  return {
    stockQty: current?.stockQty ?? null,
    regionBlock: current?.regionBlock ?? null,
    pending: enabled && current === null,
    error: current?.error ?? null,
    blocked: enabled && (current === null || current.error !== null),
    retry: () => setRevision((value) => value + 1),
  };
}
