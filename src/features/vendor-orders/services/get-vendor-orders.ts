import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import {
  mapVendorOrderDetail,
  mapVendorOrdersSnapshot,
  type WpVendorOrder,
  type WpVendorOrdersList,
} from "./vendor-order-mappers";
import type { VendorOrderDetail, VendorOrderStatus, VendorOrdersSnapshot } from "../types/vendor-orders";

export async function getVendorOrders(filters: {
  page: number;
  search: string;
  status: VendorOrderStatus | "all";
}): Promise<VendorOrdersSnapshot> {
  const accessToken = await getSellerAccessToken();
  const empty = { items: [], page: filters.page, perPage: 20, total: 0, totalPages: 1 };

  if (!accessToken) {
    return empty;
  }

  const params = new URLSearchParams({
    page: String(filters.page),
    per_page: "20",
    status: filters.status,
  });
  if (filters.search) {
    params.set("search", filters.search);
  }

  const result = await wpRest<WpVendorOrdersList>(`/papelito/v1/vendor/me/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["vendor-orders"],
  });

  return result.ok ? mapVendorOrdersSnapshot(result.data) : empty;
}

export async function getVendorOrderDetail(orderId: string): Promise<VendorOrderDetail | null> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken || !/^\d+$/.test(orderId)) {
    return null;
  }

  const result = await wpRest<WpVendorOrder>(`/papelito/v1/vendor/me/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["vendor-orders"],
  });

  return result.ok ? mapVendorOrderDetail(result.data) : null;
}
