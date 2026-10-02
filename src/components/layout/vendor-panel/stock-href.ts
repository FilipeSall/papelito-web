import { VENDOR_STOCK_DEFAULT_PER_PAGE } from "@/features/vendor-stock/types/vendor-stock";
import type { VendorStockFilters } from "@/features/vendor-stock/types/vendor-stock";

export function buildStockHref(filters: VendorStockFilters, page = 1) {
  const params = new URLSearchParams({ filter: filters.filter });
  if (filters.search) params.set("search", filters.search);
  if (filters.perPage && filters.perPage !== VENDOR_STOCK_DEFAULT_PER_PAGE) {
    params.set("per_page", String(filters.perPage));
  }
  if (filters.category && filters.category > 0) params.set("category", String(filters.category));
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.type !== "products") params.set("type", filters.type);
  if (filters.sort !== "name_asc") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  return `/vendor/estoque?${params.toString()}`;
}
