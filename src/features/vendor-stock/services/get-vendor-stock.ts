import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorStockFilter, VendorStockSnapshot } from "../types/vendor-stock";

type WpStockResponse = {
  items?: Array<{
    is_zeroed?: boolean;
    product_id?: number;
    product_name?: string;
    qty?: number;
    sku?: string;
    updated_at?: string;
  }>;
  page?: number;
  per_page?: number;
  total?: number;
};

export async function getVendorStock(filters: {
  filter: VendorStockFilter;
  page: number;
  search: string;
}): Promise<VendorStockSnapshot> {
  const accessToken = await getSellerAccessToken();
  const empty = { items: [], page: filters.page, perPage: 20, total: 0 };

  if (!accessToken) {
    return empty;
  }

  const params = new URLSearchParams({
    filter: filters.filter,
    page: String(filters.page),
    per_page: "20",
  });
  if (filters.search) {
    params.set("search", filters.search);
  }

  const result = await wpRest<WpStockResponse>(`/papelito/v1/vendor/me/stock?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) {
    return empty;
  }

  return {
    items: (result.data.items ?? []).map((item) => ({
      isZeroed: Boolean(item.is_zeroed),
      productId: Number(item.product_id) || 0,
      productName: item.product_name ?? "Produto",
      qty: Number(item.qty) || 0,
      sku: item.sku ?? "",
      updatedAt: item.updated_at ?? "",
    })),
    page: Number(result.data.page) || filters.page,
    perPage: Number(result.data.per_page) || 20,
    total: Number(result.data.total) || 0,
  };
}
