import "server-only";

import { buildSalesSeriesPoints, type SalesSeriesPoint } from "@/lib/sales-series";
import type { AdminSalesFilters } from "@/lib/server/admin-sales-filters";
import { wpRest } from "@/lib/server/wp-rest";

export type AdminAnalyticsSeriesPoint = SalesSeriesPoint;

export type AdminSalesLeaderboardItem = {
  label: string;
  share: number;
  value: number;
};

export type AdminSalesAnalyticsSnapshot = {
  avgOrderValue: number;
  dataSource: "live" | "fallback";
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
  previousGrossRevenue: number | null;
  refundsTotal: number;
  revenueDeltaRate: number | null;
  revenueSeries: AdminAnalyticsSeriesPoint[];
  shippingTotal: number;
  taxesTotal: number;
  usedFallback: boolean;
};

type UnknownRecord = Record<string, unknown>;

type CanonicalSalesSnapshot = {
  avgOrderValue?: unknown;
  discountsTotal?: unknown;
  grossRevenue?: unknown;
  itemsSold?: unknown;
  leaderboard?: unknown;
  netRevenue?: unknown;
  orderStatusSeries?: unknown;
  orderVolumeByInterval?: unknown;
  orders?: unknown;
  paymentMixSeries?: unknown;
  previousGrossRevenue?: unknown;
  refundsTotal?: unknown;
  revenueByInterval?: unknown;
  shippingTotal?: unknown;
  taxesTotal?: unknown;
};

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function mapValueSeries(value: unknown): AdminAnalyticsSeriesPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const row = asRecord(item);
    const label = typeof row?.label === "string" ? row.label.trim() : "";
    const amount = toNumber(row?.value);

    return label ? [{ label, value: Math.max(0, amount) }] : [];
  });
}

function mapLeaderboard(value: unknown): AdminSalesLeaderboardItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const row = asRecord(item);
    const label = typeof row?.label === "string" ? row.label.trim() : "";

    return label
      ? [
          {
            label,
            share: Math.max(0, toNumber(row?.share)),
            value: Math.max(0, toNumber(row?.value)),
          },
        ]
      : [];
  });
}

function mapRevenueSeries(value: unknown, filters: AdminSalesFilters) {
	const rawValues = asRecord(value) ?? {};
	const valuesByKey = Object.fromEntries(
		Object.entries(rawValues).map(([key, amount]) => [key, Math.max(0, toNumber(amount))]),
	);

	return buildSalesSeriesPoints({
		from: filters.from,
		interval: filters.interval,
		to: filters.to,
		valuesByKey,
	});
}

function buildEmptySnapshot(
  filters: AdminSalesFilters,
  issues: string[],
): AdminSalesAnalyticsSnapshot {
  return {
    avgOrderValue: 0,
    dataSource: "fallback",
    discountsTotal: 0,
    grossRevenue: 0,
    issues,
    itemsSold: 0,
    leaderboard: [],
    mixSeries: [],
    netRevenue: 0,
    orderStatusSeries: [],
    orderVolumeSeries: buildSalesSeriesPoints({
      from: filters.from,
      interval: filters.interval,
      to: filters.to,
      valuesByKey: {},
    }),
    orders: 0,
    paymentMixSampled: 0,
    paymentMixSeries: [],
    paymentMixTotalAvailable: 0,
    periodLabel: filters.periodLabel,
    previousGrossRevenue: null,
    refundsTotal: 0,
    revenueDeltaRate: null,
    revenueSeries: buildSalesSeriesPoints({
      from: filters.from,
      interval: filters.interval,
      to: filters.to,
      valuesByKey: {},
    }),
    shippingTotal: 0,
    taxesTotal: 0,
    usedFallback: true,
  };
}

export async function getAdminSalesAnalyticsSnapshot(
  accessToken: string | undefined,
  filters: AdminSalesFilters,
): Promise<AdminSalesAnalyticsSnapshot> {
  if (!accessToken) {
    return buildEmptySnapshot(filters, [
      "Sessão sem access token para consultar o snapshot financeiro.",
    ]);
  }

  const query = new URLSearchParams({
    from: filters.from,
    interval: filters.interval,
    segment: filters.segment,
    to: filters.to,
  });
  const result = await wpRest<CanonicalSalesSnapshot>(
    `/papelito/v1/admin/sales/snapshot?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 300,
      tags: ["admin-sales"],
    },
  );

  if (!result.ok) {
    return buildEmptySnapshot(filters, [
      `[papelito] sales/snapshot -> ${result.error.message}`,
    ]);
  }

  const revenueSeries = mapRevenueSeries(result.data.revenueByInterval, filters);
  const orderVolumeSeries = mapRevenueSeries(result.data.orderVolumeByInterval, filters);
  const orderStatusSeries = mapValueSeries(result.data.orderStatusSeries);
  const paymentMixSeries = mapValueSeries(result.data.paymentMixSeries);
  const grossRevenue = Math.max(0, toNumber(result.data.grossRevenue));
  const previousGrossRevenue =
    result.data.previousGrossRevenue === null ||
    result.data.previousGrossRevenue === undefined
      ? null
      : Math.max(0, toNumber(result.data.previousGrossRevenue));
  const revenueDeltaRate =
    previousGrossRevenue !== null && previousGrossRevenue > 0
      ? ((grossRevenue - previousGrossRevenue) / previousGrossRevenue) * 100
      : null;

  return {
    avgOrderValue: Math.max(0, toNumber(result.data.avgOrderValue)),
    dataSource: "live",
    discountsTotal: Math.max(0, toNumber(result.data.discountsTotal)),
    grossRevenue,
    issues: [],
    itemsSold: Math.max(0, toNumber(result.data.itemsSold)),
    leaderboard: mapLeaderboard(result.data.leaderboard),
    mixSeries: orderStatusSeries.slice(0, 4),
    netRevenue: Math.max(0, toNumber(result.data.netRevenue)),
    orderStatusSeries,
    orderVolumeSeries,
    orders: Math.max(0, toNumber(result.data.orders)),
    paymentMixSampled: Math.max(0, toNumber(result.data.orders)),
    paymentMixSeries,
    paymentMixTotalAvailable: Math.max(0, toNumber(result.data.orders)),
    periodLabel: filters.periodLabel,
    previousGrossRevenue,
    refundsTotal: Math.max(0, toNumber(result.data.refundsTotal)),
    revenueDeltaRate,
    revenueSeries,
    shippingTotal: Math.max(0, toNumber(result.data.shippingTotal)),
    taxesTotal: Math.max(0, toNumber(result.data.taxesTotal)),
    usedFallback: false,
  };
}
