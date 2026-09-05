import type {
  VendorOrderStatus,
  VendorOrdersFilters,
  VendorOrdersFiscalFilter,
} from "../types/vendor-orders";

const statuses = new Set<VendorOrderStatus>([
  "aguardando_pagamento",
  "aguardando_estoque",
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
]);

export function normalizeVendorOrdersStatus(value: string | null | undefined): VendorOrderStatus | "all" {
  return typeof value === "string" && statuses.has(value as VendorOrderStatus) ? (value as VendorOrderStatus) : "all";
}

/**
 * Segundo eixo de recorte: a nota fiscal pendente atravessa as situações, então
 * ela não pode ser mais um valor de `status` — um pedido em separação e um já
 * enviado podem estar os dois sem nota.
 */
export function normalizeVendorOrdersFiscal(value: string | null | undefined): VendorOrdersFiscalFilter {
  return value === "pending" ? "pending" : "all";
}

export function parseVendorOrdersPage(value: string | null | undefined): number {
  return Math.max(1, Number.parseInt(value ?? "", 10) || 1);
}

export function parseVendorOrdersSearch(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildVendorOrdersQueryString(filters: VendorOrdersFilters): string {
  const params = new URLSearchParams({ status: filters.status });

  if (filters.search) params.set("search", filters.search);
  if (filters.fiscal !== "all") params.set("fiscal", filters.fiscal);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params.toString();
}

export function buildVendorOrdersHref(filters: VendorOrdersFilters, pathname = "/vendor/pedidos"): string {
  const query = buildVendorOrdersQueryString(filters);
  return query ? `${pathname}?${query}` : pathname;
}

export function buildVendorOrdersCacheKey(filters: VendorOrdersFilters): string {
  return `vendor-orders:${filters.status}:${filters.fiscal}:${filters.search}:${filters.page}`;
}

export function areVendorOrdersFiltersEqual(a: VendorOrdersFilters, b: VendorOrdersFilters): boolean {
  return (
    a.page === b.page && a.search === b.search && a.status === b.status && a.fiscal === b.fiscal
  );
}
