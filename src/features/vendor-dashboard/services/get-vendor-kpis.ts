import "server-only";

import {
  buildSalesSeriesPoints,
  type SalesSeriesInterval,
} from "@/lib/sales-series";
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
  period?: { from?: string; interval?: SalesSeriesInterval | string; to?: string };
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
    revalidate: 60,
    tags: ["vendor-kpis"],
  });

  if (!result.ok) {
    return emptySnapshot(filters);
  }

  const data = result.data;
  const interval = data.period?.interval === "month" ? "month" : "day";
  const from = data.period?.from ?? filters.from;
  const to = data.period?.to ?? filters.to;
  const revenueSeriesValues = Object.fromEntries(
    (data.revenue_series ?? []).map((point) => [point.label ?? "", Number(point.value) || 0]),
  );

  return {
    averageTicket: Number(data.average_ticket) || 0,
    awaitingPaymentOrders: Number(data.awaiting_payment_orders) || 0,
    grossRevenue: Number(data.gross_revenue) || 0,
    ordersCount: Number(data.orders_count) || 0,
    pendingOrders: Number(data.pending_orders) || 0,
    period: {
      from,
      interval,
      to,
    },
    revenueSeries: buildSalesSeriesPoints({
      from,
      to,
      interval,
      valuesByKey: revenueSeriesValues,
    }),
    topProducts: (data.top_products ?? []).map((product) => ({
      productId: Number(product.product_id) || 0,
      name: product.name ?? "Produto",
      qty: Number(product.qty) || 0,
      revenue: Number(product.revenue) || 0,
    })),
  };
}
