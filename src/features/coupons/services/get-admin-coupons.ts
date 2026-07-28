import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { CouponListFilters, CouponListSnapshot } from "../types/coupon";
import { mapWpCouponList } from "./coupon-mappers";

export type AdminCouponsSnapshot = {
  list: CouponListSnapshot;
  issues: string[];
};

export async function getAdminCouponsSnapshot(
  accessToken: string | undefined,
  filters: CouponListFilters = {},
): Promise<AdminCouponsSnapshot> {
  if (!accessToken) {
    return {
      list: { items: [], total: 0, page: 1, perPage: 20 },
      issues: ["Sessão sem access token para consultar cupons."],
    };
  }

  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.page && filters.page > 0) params.set("page", String(filters.page));
  if (filters.perPage && filters.perPage > 0) params.set("per_page", String(filters.perPage));

  const query = params.toString();
  const path = `/papelito/v1/admin/coupons${query ? `?${query}` : ""}`;

  const result = await wpRest<unknown>(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["admin-coupons"],
  });

  if (!result.ok) {
    return {
      list: { items: [], total: 0, page: filters.page ?? 1, perPage: filters.perPage ?? 20 },
      issues: [result.error.message],
    };
  }

  return {
    list: mapWpCouponList(result.data as Parameters<typeof mapWpCouponList>[0]),
    issues: [],
  };
}
