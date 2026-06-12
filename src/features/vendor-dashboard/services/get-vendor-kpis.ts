import "server-only";

import type { AdminSalesFilters } from "@/lib/server/admin-sales-filters";
import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import type { VendorDashboardSnapshot } from "../types/vendor-dashboard";

type WpVendorKpis = {
  average_ticket?: number;
  awaiting_payment_orders?: number;
  gross_revenue?: number;
  orders_count?: number;
  pending_orders?: number;
  period?: { from?: string; interval?: string; to?: string };
  revenue_series?: Array<{ label?: string; value?: number }>;
  top_products?: Array<{ name?: string; product_id?: number; qty?: number; revenue?: number }>;
};

function emptySnapshot(filters: AdminSalesFilters): VendorDashboardSnapshot {
  return {
    averageTicket: 0,
    awaitingPaymentOrders: 0,
    grossRevenue: 0,
    ordersCount: 0,
    pendingOrders: 0,
    period: { from: filters.from, interval: filters.interval, to: filters.to },
    revenueSeries: [],
    topProducts: [],
  };
}

export async function getVendorKpis(filters: AdminSalesFilters): Promise<VendorDashboardSnapshot> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return emptySnapshot(filters);
  }

  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    interval: filters.interval,
  });
  const result = await wpRest<WpVendorKpis>(`/papelito/v1/vendor/me/kpis?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) {
    return emptySnapshot(filters);
  }

  const data = result.data;
  const interval =
    data.period?.interval === "week" || data.period?.interval === "month"
      ? data.period.interval
      : "day";

  return {
    averageTicket: Number(data.average_ticket) || 0,
    awaitingPaymentOrders: Number(data.awaiting_payment_orders) || 0,
    grossRevenue: Number(data.gross_revenue) || 0,
    ordersCount: Number(data.orders_count) || 0,
    pendingOrders: Number(data.pending_orders) || 0,
    period: {
      from: data.period?.from ?? filters.from,
      interval,
      to: data.period?.to ?? filters.to,
    },
    revenueSeries: (data.revenue_series ?? []).map((point) => ({
      label: point.label ?? "",
      value: Number(point.value) || 0,
    })),
    topProducts: (data.top_products ?? []).map((product) => ({
      productId: Number(product.product_id) || 0,
      name: product.name ?? "Produto",
      qty: Number(product.qty) || 0,
      revenue: Number(product.revenue) || 0,
    })),
  };
}
