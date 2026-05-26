import type { VendorStockFilter } from "@/features/vendor-stock/types/vendor-stock";

export function buildStockHref(filter: VendorStockFilter, search: string, page = 1) {
  const params = new URLSearchParams({ filter });
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  return `/vendor/estoque?${params.toString()}`;
}
