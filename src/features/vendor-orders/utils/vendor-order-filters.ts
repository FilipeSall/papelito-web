import type { VendorOrderStatus, VendorOrdersFilters } from "../types/vendor-orders";

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

export function parseVendorOrdersPage(value: string | null | undefined): number {
  return Math.max(1, Number.parseInt(value ?? "", 10) || 1);
}

export function parseVendorOrdersSearch(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildVendorOrdersQueryString(filters: VendorOrdersFilters): string {
  const params = new URLSearchParams({ status: filters.status });

  if (filters.search) params.set("search", filters.search);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params.toString();
}

export function buildVendorOrdersHref(filters: VendorOrdersFilters, pathname = "/vendor/pedidos"): string {
  const query = buildVendorOrdersQueryString(filters);
  return query ? `${pathname}?${query}` : pathname;
}

export function buildVendorOrdersCacheKey(filters: VendorOrdersFilters): string {
  return `vendor-orders:${filters.status}:${filters.search}:${filters.page}`;
}

export function areVendorOrdersFiltersEqual(a: VendorOrdersFilters, b: VendorOrdersFilters): boolean {
  return a.page === b.page && a.search === b.search && a.status === b.status;
}
