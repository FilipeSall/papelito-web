import "server-only";

import { buildSalesSeriesPoints, type SalesSeriesPoint } from "@/lib/sales-series";
import type { AdminSalesFilters } from "@/lib/server/admin-sales-filters";
import { getAdminSalesOrdersAggregate } from "@/lib/server/admin-sales-orders";
import { getAdminSalesPaymentMix } from "@/lib/server/admin-sales-payment-mix";
import { wpRest } from "@/lib/server/wp-rest";

type UnknownRecord = Record<string, unknown>;

type WcStatsResponse = {
  totals?: UnknownRecord | null;
  intervals?: Array<{
    interval?: string | null;
    subtotals?: UnknownRecord | null;
  }> | null;
};

type WcSalesReportRow = {
  average_order_value?: unknown;
  average_sales?: unknown;
  net_sales?: unknown;
  total_discount?: unknown;
  total_items?: unknown;
  total_orders?: unknown;
  total_refunds?: unknown;
  total_sales?: unknown;
  total_shipping?: unknown;
  total_tax?: unknown;
  totals?: unknown;
  totals_grouped_by?: unknown;
};

export type AdminAnalyticsSeriesPoint = SalesSeriesPoint;

export type AdminSalesLeaderboardItem = {
  label: string;
  share: number;
  value: number;
};

export type AdminSalesAnalyticsSnapshot = {
  avgOrderValue: number;
  dataSource: "fallback" | "live";
  discountsTotal: number;
  grossRevenue: number;
  issues: string[];
  itemsSold: number;
  leaderboard: AdminSalesLeaderboardItem[];
  mixSeries: AdminAnalyticsSeriesPoint[];
  netRevenue: number;
  orderStatusSeries: AdminAnalyticsSeriesPoint[];
  orderVolumeSeries: AdminAnalyticsSeriesPoint[];
  orders: number;
  paymentMixSampled: number;
  paymentMixSeries: AdminAnalyticsSeriesPoint[];
  paymentMixTotalAvailable: number;
  periodLabel: string;
  refundsTotal: number;
  revenueDeltaRate: number | null;
  revenueSeries: AdminAnalyticsSeriesPoint[];
  shippingTotal: number;
  taxesTotal: number;
  usedFallback: boolean;
};

const STATUS_LABEL_BY_KEY: Record<string, string> = {
  cancelled: "cancelado",
  completed: "concluido",
  failed: "falhou",
  on_hold: "em espera",
  pending: "pendente",
  processing: "processando",
  refunded: "reembolsado",
};

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveNumber(value: unknown) {
  return Math.max(0, toNumber(value) ?? 0);
}

function firstNumericValue(record: UnknownRecord | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const parsed = toNumber(record[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function mapStatsIntervals(
  payload: WcStatsResponse | null,
  valueKeys: string[],
  filters: AdminSalesFilters,
): AdminAnalyticsSeriesPoint[] {
  const intervals = payload?.intervals;

  if (!Array.isArray(intervals) || intervals.length === 0) {
    return [];
  }

  const valuesByKey = new Map<string, number>();

  for (const entry of intervals) {
    if (typeof entry.interval !== "string" || !entry.interval.trim()) {
      continue;
    }

    const intervalValue =
      firstNumericValue(asRecord(entry.subtotals), valueKeys) ??
      firstNumericValue(asRecord(entry), valueKeys) ??
      0;

    valuesByKey.set(entry.interval.trim(), Math.max(0, intervalValue));
  }

  return buildSalesSeriesPoints({
    from: filters.from,
    to: filters.to,
    interval: filters.interval,
    valuesByKey,
  });
}

function normalizeStatusLabel(key: string) {
  const normalizedKey = key.toLowerCase();

  for (const [needle, label] of Object.entries(STATUS_LABEL_BY_KEY)) {
    if (normalizedKey.includes(needle)) {
      return label;
    }
  }

  return normalizedKey
    .replace(/_orders?$/, "")
    .replace(/_count$/, "")
    .replace(/_/g, " ");
}

function isAnalyticsTotalsActive(totals: UnknownRecord | null) {
  if (!totals) {
    return false;
  }

  const probes = [
    "total_sales",
    "gross_sales",
    "net_revenue",
    "orders_count",
    "num_items_sold",
    "items_sold",
  ];

  for (const key of probes) {
    if (toPositiveNumber(totals[key]) > 0) {
      return true;
    }
  }

  return false;
}

function getSalesReportPeriodTotals(
  payload: WcSalesReportRow | null,
): Record<string, UnknownRecord> | null {
  if (!payload || !payload.totals) {
    return null;
  }

  const totals = payload.totals;

  if (typeof totals !== "object" || Array.isArray(totals)) {
    return null;
  }

  const result: Record<string, UnknownRecord> = {};
  for (const [key, value] of Object.entries(totals as Record<string, unknown>)) {
    const record = asRecord(value);
    if (record) {
      result[key] = record;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function mapSalesReportSeries(
  periodTotals: Record<string, UnknownRecord> | null,
  valueKey: string,
  filters: AdminSalesFilters,
): AdminAnalyticsSeriesPoint[] {
  if (!periodTotals) {
    return [];
  }

  const valuesByKey = Object.fromEntries(
    Object.entries(periodTotals).map(([periodKey, periodData]) => [
      periodKey,
      toPositiveNumber(periodData[valueKey]),
    ]),
  );

  return buildSalesSeriesPoints({
    from: filters.from,
    to: filters.to,
    interval: filters.interval,
    valuesByKey,
  });
}

function mapOrderStatusTotals(totals: UnknownRecord | null): AdminAnalyticsSeriesPoint[] {
  if (!totals) {
    return [];
  }

  const entries = Object.entries(totals)
    .map(([key, value]) => ({
      key,
      value: toPositiveNumber(value),
    }))
    .filter(({ key, value }) => {
      if (value <= 0) {
        return false;
      }

      if (/total_orders|orders_count/i.test(key)) {
        return false;
      }

      return /(pending|processing|completed|on_hold|cancelled|failed|refunded|_orders?$)/i.test(
        key,
      );
    })
    .map(({ key, value }) => ({
      label: normalizeStatusLabel(key),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return entries.slice(0, 6);
}

function parseLeaderboardRow(value: unknown): { label: string; value: number } | null {
  if (Array.isArray(value)) {
    const labelCandidate = value.find((entry) => typeof entry === "string");
    const numericCandidate = value
      .map((entry) => toNumber(entry))
      .filter((entry): entry is number => entry !== null)
      .at(-1);

    if (typeof labelCandidate === "string" && typeof numericCandidate === "number") {
      return {
        label: labelCandidate.trim().toLowerCase(),
        value: Math.max(0, numericCandidate),
      };
    }

    return null;
  }

  const row = asRecord(value);
  if (!row) {
    return null;
  }

  const label =
    (typeof row.name === "string" && row.name) ||
    (typeof row.label === "string" && row.label) ||
    (typeof row.title === "string" && row.title) ||
    (typeof row.product === "string" && row.product) ||
    (typeof row.category === "string" && row.category);

  const amount =
    firstNumericValue(row, ["net_revenue", "total_sales", "sales", "revenue", "amount", "value"]) ??
    firstNumericValue(row, ["items_sold", "orders_count", "quantity"]);

  if (!label || amount === null) {
    return null;
  }

  return {
    label: label.trim().toLowerCase(),
    value: Math.max(0, amount),
  };
}

function parseLeaderboardCollection(value: unknown): Array<{ label: string; value: number }> {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(parseLeaderboardRow)
      .filter((row): row is { label: string; value: number } => row !== null)
      .sort((a, b) => b.value - a.value);
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  if (Array.isArray(record.rows)) {
    return parseLeaderboardCollection(record.rows);
  }

  return [];
}

function pickLeaderboardRows(
  payload: unknown,
  collections: string[],
): Array<{ label: string; value: number }> {
  const record = asRecord(payload);

  if (!record) {
    return parseLeaderboardCollection(payload);
  }

  for (const key of collections) {
    const rows = parseLeaderboardCollection(record[key]);
    if (rows.length > 0) {
      return rows;
    }
  }

  for (const value of Object.values(record)) {
    const rows = parseLeaderboardCollection(value);
    if (rows.length > 0) {
      return rows;
    }
  }

  return [];
}

function toShareRows(
  rows: Array<{ label: string; value: number }>,
  maxItems = 5,
): AdminSalesLeaderboardItem[] {
  const limited = rows.filter((row) => row.value > 0).slice(0, maxItems);
  const total = limited.reduce((sum, row) => sum + row.value, 0);

  if (total <= 0) {
    return [];
  }

  return limited.map((row) => ({
    label: row.label,
    value: row.value,
    share: Number(((row.value / total) * 100).toFixed(1)),
  }));
}

function extractSalesFallbackRow(payload: unknown): WcSalesReportRow | null {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const first = asRecord(payload[0]);
  if (!first) {
    return null;
  }

  return first as WcSalesReportRow;
}

function isSnapshotEmpty(snapshot: AdminSalesAnalyticsSnapshot) {
  return (
    snapshot.grossRevenue <= 0 &&
    snapshot.orders <= 0 &&
    snapshot.revenueSeries.length === 0 &&
    snapshot.orderStatusSeries.length === 0 &&
    snapshot.leaderboard.length === 0
  );
}

function withIssuePrefix(message: string) {
  return `[woo] ${message}`;
}

function buildApiPath(path: string, query?: Record<string, string | number>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    params.set(key, String(value));
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return `${path}${suffix}`;
}

function buildEmptySnapshot(
  filters: AdminSalesFilters,
  issues: string[] = [],
  dataSource: AdminSalesAnalyticsSnapshot["dataSource"] = "fallback",
): AdminSalesAnalyticsSnapshot {
  const usedFallback = dataSource !== "live";

  return {
    periodLabel: filters.periodLabel,
    grossRevenue: 0,
    netRevenue: 0,
    orders: 0,
    avgOrderValue: 0,
    discountsTotal: 0,
    shippingTotal: 0,
    taxesTotal: 0,
    refundsTotal: 0,
    itemsSold: 0,
    revenueDeltaRate: null,
    revenueSeries: [],
    orderVolumeSeries: [],
    orderStatusSeries: [],
    mixSeries: [],
    paymentMixSeries: [],
    paymentMixSampled: 0,
    paymentMixTotalAvailable: 0,
    leaderboard: [],
    dataSource,
    usedFallback,
    issues,
  };
}

export async function getAdminSalesAnalyticsSnapshot(
  accessToken: string | undefined,
  filters: AdminSalesFilters,
): Promise<AdminSalesAnalyticsSnapshot> {
  if (!accessToken) {
    return buildEmptySnapshot(filters, [
      "Sessão sem access token para consultar endpoints WooCommerce.",
    ]);
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const analyticsQuery = {
    after: filters.afterIso,
    before: filters.beforeIso,
    date_type: "date_created",
    interval: filters.interval,
  };

  const [
    revenueResult,
    ordersResult,
    productsResult,
    leaderboardResult,
    salesFallbackResult,
    paymentMix,
  ] = await Promise.all([
    wpRest<WcStatsResponse>(buildApiPath("/wc-analytics/reports/revenue/stats", analyticsQuery), {
      headers,
      revalidate: 300,
      tags: ["admin-sales"],
    }),
    wpRest<WcStatsResponse>(buildApiPath("/wc-analytics/reports/orders/stats", analyticsQuery), {
      headers,
      revalidate: 300,
      tags: ["admin-sales"],
    }),
    wpRest<WcStatsResponse>(buildApiPath("/wc-analytics/reports/products/stats", analyticsQuery), {
      headers,
      revalidate: 300,
      tags: ["admin-sales"],
    }),
    wpRest<UnknownRecord>(
      buildApiPath("/wc-analytics/leaderboards", {
        after: filters.afterIso,
        before: filters.beforeIso,
        per_page: 6,
      }),
      { headers, revalidate: 300, tags: ["admin-sales"] },
    ),
    wpRest<unknown[]>(
      buildApiPath("/wc/v3/reports/sales", {
        date_max: filters.to,
        date_min: filters.from,
      }),
      { headers, revalidate: 300, tags: ["admin-sales"] },
    ),
    getAdminSalesPaymentMix(accessToken, filters),
  ]);

  const issues: string[] = [];

  if (!revenueResult.ok) {
    issues.push(withIssuePrefix(`revenue/stats -> ${revenueResult.error.message}`));
  }

  if (!ordersResult.ok) {
    issues.push(withIssuePrefix(`orders/stats -> ${ordersResult.error.message}`));
  }

  if (!productsResult.ok) {
    issues.push(withIssuePrefix(`products/stats -> ${productsResult.error.message}`));
  }

  if (!leaderboardResult.ok) {
    issues.push(withIssuePrefix(`leaderboards -> ${leaderboardResult.error.message}`));
  }

  if (!salesFallbackResult.ok) {
    issues.push(withIssuePrefix(`reports/sales -> ${salesFallbackResult.error.message}`));
  }

  for (const error of paymentMix.errors) {
    issues.push(withIssuePrefix(error));
  }

  if (
    paymentMix.truncated &&
    paymentMix.totalOrdersAvailable > paymentMix.ordersSampled &&
    paymentMix.ordersSampled > 0
  ) {
    issues.push(
      `Mix de pagamento amostrado a partir dos ${paymentMix.ordersSampled} pedidos mais recentes (total no período: ${paymentMix.totalOrdersAvailable}).`,
    );
  }

  const revenueStats = revenueResult.ok ? revenueResult.data : null;
  const ordersStats = ordersResult.ok ? ordersResult.data : null;
  const productsStats = productsResult.ok ? productsResult.data : null;
  const leaderboardPayload = leaderboardResult.ok ? leaderboardResult.data : null;
  const salesFallbackRow = salesFallbackResult.ok
    ? extractSalesFallbackRow(salesFallbackResult.data)
    : null;

  const revenueTotals = asRecord(revenueStats?.totals);
  const ordersTotals = asRecord(ordersStats?.totals);
  const productsTotals = asRecord(productsStats?.totals);

  const wcAnalyticsRevenueActive = isAnalyticsTotalsActive(revenueTotals);
  const wcAnalyticsOrdersActive = isAnalyticsTotalsActive(ordersTotals);
  const wcAnalyticsProductsActive = isAnalyticsTotalsActive(productsTotals);
  const salesReportTotals = getSalesReportPeriodTotals(salesFallbackRow);
  const salesReportActive =
    salesFallbackRow !== null && toPositiveNumber(salesFallbackRow.total_sales) > 0;

  const salesReportGross = toPositiveNumber(salesFallbackRow?.total_sales);
  const salesReportNet = toPositiveNumber(salesFallbackRow?.net_sales);
  const salesReportOrders = toPositiveNumber(salesFallbackRow?.total_orders);
  const salesReportItems = toPositiveNumber(salesFallbackRow?.total_items);
  const salesReportTax = toPositiveNumber(salesFallbackRow?.total_tax);
  const salesReportShipping = toPositiveNumber(salesFallbackRow?.total_shipping);
  const salesReportDiscount = toPositiveNumber(salesFallbackRow?.total_discount);
  const salesReportRefunds = toPositiveNumber(salesFallbackRow?.total_refunds);
  const salesReportAvgTicket =
    toNumber(salesFallbackRow?.average_order_value) ??
    toNumber(salesFallbackRow?.average_sales) ??
    (salesReportOrders > 0 ? salesReportGross / salesReportOrders : 0);

  const grossRevenue = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["total_sales", "gross_sales", "total_revenue", "sales"]) ??
      salesReportGross
    : salesReportGross;

  const netRevenue = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["net_revenue", "net_sales", "total_sales"]) ??
      salesReportNet
    : salesReportNet;

  const orders = wcAnalyticsOrdersActive
    ? firstNumericValue(ordersTotals, ["orders_count", "total_orders", "orders"]) ??
      salesReportOrders
    : salesReportOrders;

  const avgOrderValue = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["avg_order_value", "average_order_value"]) ??
      (orders > 0 ? grossRevenue / orders : null) ??
      salesReportAvgTicket
    : orders > 0
      ? grossRevenue / orders
      : salesReportAvgTicket;

  const discountsTotal = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["discounts", "total_discount", "coupons", "discount_total"]) ??
      salesReportDiscount
    : salesReportDiscount;

  const shippingTotal = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["shipping", "total_shipping", "shipping_total"]) ??
      salesReportShipping
    : salesReportShipping;

  const taxesTotal = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["taxes", "total_tax", "tax_total"]) ?? salesReportTax
    : salesReportTax;

  const refundsTotal = wcAnalyticsRevenueActive
    ? firstNumericValue(revenueTotals, ["refunds", "total_refunds", "refund_total"]) ??
      salesReportRefunds
    : salesReportRefunds;

  const itemsSold = wcAnalyticsProductsActive
    ? firstNumericValue(productsTotals, ["items_sold", "num_items_sold", "products", "items"]) ??
      salesReportItems
    : salesReportItems;

  const wcRevenueSeries = wcAnalyticsRevenueActive
    ? mapStatsIntervals(
        revenueStats,
        ["total_sales", "gross_sales", "total_revenue", "net_revenue"],
        filters,
      )
    : [];
  const revenueSeries =
    wcRevenueSeries.length > 0
      ? wcRevenueSeries
      : mapSalesReportSeries(salesReportTotals, "sales", filters);

  const wcOrderVolumeSeries = wcAnalyticsOrdersActive
    ? mapStatsIntervals(ordersStats, ["orders_count", "total_orders", "orders"], filters)
    : [];
  const orderVolumeSeries =
    wcOrderVolumeSeries.length > 0
      ? wcOrderVolumeSeries
      : mapSalesReportSeries(salesReportTotals, "orders", filters);

  const orderStatusSeries = mapOrderStatusTotals(ordersTotals);

  const productsLeaderboardRows = pickLeaderboardRows(leaderboardPayload, ["products", "items"]);
  const categoryLeaderboardRows = pickLeaderboardRows(leaderboardPayload, [
    "categories",
    "product_categories",
    "statuses",
  ]);

  const fallbackMixRows =
    categoryLeaderboardRows.length > 0
      ? categoryLeaderboardRows
      : orderStatusSeries.map((point) => ({ label: point.label, value: point.value }));

  const mixSeries = toShareRows(fallbackMixRows, 4).map((row) => ({
    label: row.label,
    value: row.value,
  }));

  const leaderboardRows = toShareRows(
    productsLeaderboardRows.length > 0
      ? productsLeaderboardRows
      : categoryLeaderboardRows.length > 0
        ? categoryLeaderboardRows
        : [{ label: "receita consolidada", value: grossRevenue }],
    6,
  );

  const revenueDeltaRate =
    revenueSeries.length >= 2 && revenueSeries[0].value > 0
      ? ((revenueSeries[revenueSeries.length - 1].value - revenueSeries[0].value) /
          revenueSeries[0].value) *
        100
      : null;

  const wcAnalyticsAvailable =
    wcAnalyticsRevenueActive || wcAnalyticsOrdersActive || wcAnalyticsProductsActive;
  const usedFallback = !wcAnalyticsAvailable && !salesReportActive;

  const snapshot: AdminSalesAnalyticsSnapshot = {
    periodLabel: filters.periodLabel,
    grossRevenue,
    netRevenue,
    orders,
    avgOrderValue,
    discountsTotal,
    shippingTotal,
    taxesTotal,
    refundsTotal,
    itemsSold,
    revenueDeltaRate,
    revenueSeries,
    orderVolumeSeries,
    orderStatusSeries,
    mixSeries,
    paymentMixSeries: paymentMix.series,
    paymentMixSampled: paymentMix.ordersSampled,
    paymentMixTotalAvailable: paymentMix.totalOrdersAvailable,
    leaderboard: leaderboardRows,
    dataSource: usedFallback ? "fallback" : "live",
    usedFallback,
    issues,
  };

  if (isSnapshotEmpty(snapshot)) {
    const ordersAggregate = await getAdminSalesOrdersAggregate(accessToken, filters);
    const aggregateIssues: string[] = [
      ...ordersAggregate.errors.map((message) => withIssuePrefix(message)),
    ];

    if (ordersAggregate.truncated) {
      aggregateIssues.push(
        `Período com ${ordersAggregate.totalOrdersAvailable} pedidos; agregacao limitada aos ${ordersAggregate.pagesFetched * 100} mais recentes para proteger o WooCommerce.`,
      );
    }

    if (ordersAggregate.orders > 0) {
      return {
        periodLabel: filters.periodLabel,
        grossRevenue: ordersAggregate.grossRevenue,
        netRevenue: ordersAggregate.netRevenue,
        orders: ordersAggregate.orders,
        avgOrderValue: ordersAggregate.avgOrderValue,
        discountsTotal: ordersAggregate.discountsTotal,
        shippingTotal: ordersAggregate.shippingTotal,
        taxesTotal: ordersAggregate.taxesTotal,
        refundsTotal: ordersAggregate.refundsTotal,
        itemsSold: ordersAggregate.itemsSold,
        revenueDeltaRate:
          ordersAggregate.revenueSeries.length >= 2 && ordersAggregate.revenueSeries[0].value > 0
            ? ((ordersAggregate.revenueSeries[ordersAggregate.revenueSeries.length - 1].value -
                ordersAggregate.revenueSeries[0].value) /
                ordersAggregate.revenueSeries[0].value) *
              100
            : null,
        revenueSeries: ordersAggregate.revenueSeries,
        orderVolumeSeries: ordersAggregate.orderVolumeSeries,
        orderStatusSeries: ordersAggregate.orderStatusSeries,
        mixSeries: ordersAggregate.orderStatusSeries.slice(0, 4),
        paymentMixSeries: paymentMix.series,
        paymentMixSampled: paymentMix.ordersSampled,
        paymentMixTotalAvailable: paymentMix.totalOrdersAvailable,
        leaderboard: ordersAggregate.leaderboard,
        dataSource: "fallback",
        usedFallback: true,
        issues: [
          ...issues,
          ...aggregateIssues,
          "Woo Analytics e reports/sales sem dados; painel recalculado a partir de /wc/v3/orders.",
        ],
      };
    }

    return buildEmptySnapshot(
      filters,
      [...issues, ...aggregateIssues, "WooCommerce sem dados no período selecionado."],
      "fallback",
    );
  }

  // Quando wc-analytics nao retorna serie de status ou produtos no leaderboard,
  // completa com agregacao de /wc/v3/orders pra trazer status reais e nomes de
  // produtos a partir dos line_items.
  const needsStatusFallback =
    salesReportActive &&
    !wcAnalyticsOrdersActive &&
    !wcAnalyticsProductsActive &&
    snapshot.orderStatusSeries.length === 0 &&
    snapshot.orders > 0;
  const needsLeaderboardFallback =
    productsLeaderboardRows.length === 0 && snapshot.orders > 0;

  if (needsStatusFallback || needsLeaderboardFallback) {
    const ordersAggregate = await getAdminSalesOrdersAggregate(accessToken, filters);

    if (snapshot.orderStatusSeries.length === 0 && ordersAggregate.orderStatusSeries.length > 0) {
      snapshot.orderStatusSeries = ordersAggregate.orderStatusSeries;
      if (snapshot.mixSeries.length === 0) {
        snapshot.mixSeries = ordersAggregate.orderStatusSeries.slice(0, 4);
      }
    }

    if (needsLeaderboardFallback && ordersAggregate.leaderboard.length > 0) {
      snapshot.leaderboard = ordersAggregate.leaderboard;
    }

    for (const error of ordersAggregate.errors) {
      snapshot.issues.push(withIssuePrefix(error));
    }
  }

  return snapshot;
}
