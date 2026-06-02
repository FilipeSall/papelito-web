import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import type { AdminVendorStockFilter } from "@/lib/server/admin-vendor-operations";

export type DetailTabKey = "data" | "coverage" | "banking" | "stock" | "orders";

export type OriginFilters = {
  page: number;
  search: string;
  status: string;
};

export type StockFilters = {
  filter: AdminVendorStockFilter;
  page: number;
  search: string;
};

export type OrderFilters = {
  page: number;
  search: string;
  status: VendorOrderStatus | "all";
};

export type VendorDetailContext = {
  activeTab: DetailTabKey;
  orderFilters: OrderFilters;
  origin: OriginFilters;
  stockFilters: StockFilters;
  vendorId: number;
};

type QueryOverrides = {
  orderFilters?: Partial<OrderFilters>;
  stockFilters?: Partial<StockFilters>;
  tab?: DetailTabKey;
};

export function buildVendorDetailQuery(
  ctx: VendorDetailContext,
  overrides: QueryOverrides = {},
): string {
  const tab = overrides.tab ?? ctx.activeTab;
  const stockFilters = { ...ctx.stockFilters, ...overrides.stockFilters };
  const orderFilters = { ...ctx.orderFilters, ...overrides.orderFilters };
  const { origin } = ctx;

  const params = new URLSearchParams();

  if (origin.status && origin.status !== "pending") params.set("originStatus", origin.status);
  if (origin.page > 1) params.set("originPage", String(origin.page));
  if (origin.search) params.set("originSearch", origin.search);

  if (tab !== "data") params.set("tab", tab);

  if (stockFilters.filter !== "all") params.set("stockFilter", stockFilters.filter);
  if (stockFilters.page > 1) params.set("stockPage", String(stockFilters.page));
  if (stockFilters.search) params.set("stockSearch", stockFilters.search);

  if (orderFilters.status !== "all") params.set("orderStatus", orderFilters.status);
  if (orderFilters.page > 1) params.set("orderPage", String(orderFilters.page));
  if (orderFilters.search) params.set("orderSearch", orderFilters.search);

  return params.toString();
}

export function vendorDetailHref(ctx: VendorDetailContext, overrides: QueryOverrides = {}): string {
  const query = buildVendorDetailQuery(ctx, overrides);
  return query ? `/admin/vendors/${ctx.vendorId}?${query}` : `/admin/vendors/${ctx.vendorId}`;
}

export function vendorBackHref(origin: OriginFilters): string {
  const params = new URLSearchParams();
  if (origin.status && origin.status !== "pending") params.set("status", origin.status);
  if (origin.page > 1) params.set("page", String(origin.page));
  if (origin.search) params.set("search", origin.search);
  const query = params.toString();
  return query ? `/admin/vendors?${query}` : "/admin/vendors";
}
