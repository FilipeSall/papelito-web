import "server-only";

import { buildSalesSeriesPoints } from "@/lib/sales-series";
import type { AdminSalesFilters } from "@/lib/server/admin-sales-filters";
import { wpRest } from "@/lib/server/wp-rest";

type WcOrder = {
  billing?: {
    company?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  date_created?: string | null;
  discount_total?: string | number | null;
  id?: number;
  line_items?: Array<{
    name?: string | null;
    quantity?: number | string | null;
    total?: string | number | null;
  }> | null;
  number?: string | null;
  payment_method_title?: string | null;
  shipping_total?: string | number | null;
  status?: string | null;
  total?: string | number | null;
  total_refunded?: string | number | null;
  total_tax?: string | number | null;
};

export type AdminSalesOrder = {
  createdAt: string;
  customerLabel: string;
  id: number;
  itemsLabel: string;
  orderNumber: string;
  paymentMethodLabel: string;
  status: string;
  total: number;
};

export type AdminSalesOrdersSnapshot = {
  currentPage: number;
  issues: string[];
  orders: AdminSalesOrder[];
  perPage: number;
  totalOrders: number;
  totalPages: number;
};

export type AdminSalesOrdersAggregate = {
  avgOrderValue: number;
  discountsTotal: number;
  errors: string[];
  grossRevenue: number;
  itemsSold: number;
  leaderboard: Array<{ label: string; share: number; value: number }>;
  netRevenue: number;
  orderStatusSeries: Array<{ label: string; value: number }>;
  orderVolumeSeries: Array<{ label: string; value: number }>;
  orders: number;
  pagesFetched: number;
  refundsTotal: number;
  revenueSeries: Array<{ label: string; value: number }>;
  shippingTotal: number;
  taxesTotal: number;
  totalOrdersAvailable: number;
  truncated: boolean;
};

const AGGREGATE_PAGE_SIZE = 100;
const AGGREGATE_MAX_PAGES = 20;
const AGGREGATE_CONCURRENCY = 4;

type OrdersPageResult = {
  orders: WcOrder[];
  totalOrders: number;
  totalPages: number;
  error?: string;
};

const SALES_STATUSES = new Set(["processing", "completed", "refunded"]);

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCustomerLabel(order: WcOrder) {
  const firstName = order.billing?.first_name?.trim() ?? "";
  const lastName = order.billing?.last_name?.trim() ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  if (order.billing?.company?.trim()) {
    return order.billing.company.trim();
  }

  return "Cliente nao identificado";
}

function buildItemsLabel(order: WcOrder) {
  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];

  if (lineItems.length === 0) {
    return "Sem itens";
  }

  const firstItem = lineItems[0]?.name?.trim() || "Item";
  const remaining = lineItems.length - 1;

  if (remaining <= 0) {
    return firstItem;
  }

  return `${firstItem} +${remaining}`;
}

function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() || "unknown";
}

function getOrderGroupKey(value: string | null | undefined, interval: AdminSalesFilters["interval"]) {
  const datePart = value?.slice(0, 10);

  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return "sem-data";
  }

  if (interval === "month") {
    return datePart.slice(0, 7);
  }

  return datePart;
}

function sortSeries(
  entries: Map<string, number>,
  filters: AdminSalesFilters,
) {
  return buildSalesSeriesPoints({
    from: filters.from,
    to: filters.to,
    interval: filters.interval,
    valuesByKey: entries,
  });
}

async function fetchOrdersPage(
  accessToken: string,
  filters: AdminSalesFilters,
  page: number,
  perPage: number,
): Promise<OrdersPageResult> {
  const params = new URLSearchParams({
    after: filters.afterIso,
    before: filters.beforeIso,
    order: "desc",
    orderby: "date",
    page: String(page),
    per_page: String(perPage),
  });

  const result = await wpRest<WcOrder[]>(`/wc/v3/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 300,
    tags: ["admin-sales", "admin-sales-orders"],
  });

  if (!result.ok) {
    return {
      orders: [],
      totalOrders: 0,
      totalPages: 0,
      error: `[woo] orders -> ${result.error.message}`,
    };
  }

  const totalOrders = Number.parseInt(result.headers.get("X-WP-Total") ?? "0", 10) || 0;
  const totalPages = Number.parseInt(result.headers.get("X-WP-TotalPages") ?? "0", 10) || 0;

  return {
    orders: Array.isArray(result.data) ? result.data : [],
    totalOrders,
    totalPages,
  };
}

export async function getAdminSalesOrdersSnapshot(
  accessToken: string | undefined,
  filters: AdminSalesFilters,
): Promise<AdminSalesOrdersSnapshot> {
  if (!accessToken) {
    return {
      orders: [],
      totalOrders: 0,
      totalPages: 0,
      currentPage: filters.page,
      perPage: filters.perPage,
      issues: ["Sessao sem access token para consultar pedidos do WooCommerce."],
    };
  }

  const pageResult = await fetchOrdersPage(
    accessToken,
    filters,
    filters.page,
    filters.perPage,
  );

  if (pageResult.error) {
    return {
      orders: [],
      totalOrders: 0,
      totalPages: 0,
      currentPage: filters.page,
      perPage: filters.perPage,
      issues: [pageResult.error],
    };
  }

  return {
    currentPage: filters.page,
    perPage: filters.perPage,
    totalOrders: pageResult.totalOrders,
    totalPages: pageResult.totalPages,
    issues: [],
    orders: pageResult.orders
      .filter((order): order is WcOrder & { id: number } => typeof order.id === "number")
      .map((order) => ({
        id: order.id,
        orderNumber: order.number?.trim() || String(order.id),
        createdAt: order.date_created ?? "",
        customerLabel: buildCustomerLabel(order),
        itemsLabel: buildItemsLabel(order),
        paymentMethodLabel: order.payment_method_title?.trim() || "Nao informado",
        status: order.status?.trim() || "unknown",
        total: Math.max(0, toNumber(order.total)),
      })),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;

      if (index >= items.length) {
        return;
      }

      results[index] = await fn(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function emptyAggregate(): AdminSalesOrdersAggregate {
  return {
    avgOrderValue: 0,
    discountsTotal: 0,
    errors: [],
    grossRevenue: 0,
    itemsSold: 0,
    leaderboard: [],
    netRevenue: 0,
    orderStatusSeries: [],
    orderVolumeSeries: [],
    orders: 0,
    pagesFetched: 0,
    refundsTotal: 0,
    revenueSeries: [],
    shippingTotal: 0,
    taxesTotal: 0,
    totalOrdersAvailable: 0,
    truncated: false,
  };
}

export async function getAdminSalesOrdersAggregate(
  accessToken: string | undefined,
  filters: AdminSalesFilters,
): Promise<AdminSalesOrdersAggregate> {
  if (!accessToken) {
    return {
      ...emptyAggregate(),
      errors: ["Sessao sem access token para consultar pedidos do WooCommerce."],
    };
  }

  const errors: string[] = [];
  const firstPage = await fetchOrdersPage(accessToken, filters, 1, AGGREGATE_PAGE_SIZE);

  if (firstPage.error) {
    errors.push(firstPage.error);
  }

  const totalAvailablePages = firstPage.totalPages;
  const pagesToFetch = Math.min(totalAvailablePages, AGGREGATE_MAX_PAGES);
  const truncated = totalAvailablePages > AGGREGATE_MAX_PAGES;

  const remainingPageNumbers = Array.from(
    { length: Math.max(0, pagesToFetch - 1) },
    (_, index) => index + 2,
  );

  const remainingPages = await mapWithConcurrency(
    remainingPageNumbers,
    AGGREGATE_CONCURRENCY,
    (page) => fetchOrdersPage(accessToken, filters, page, AGGREGATE_PAGE_SIZE),
  );

  for (const pageResult of remainingPages) {
    if (pageResult.error) {
      errors.push(pageResult.error);
    }
  }

  const allOrders = [firstPage, ...remainingPages].flatMap((pageResult) => pageResult.orders);
  const pagesFetched = 1 + remainingPages.length;

  let grossRevenue = 0;
  let discountsTotal = 0;
  let shippingTotal = 0;
  let taxesTotal = 0;
  let refundsTotal = 0;
  let itemsSold = 0;
  let paidOrders = 0;

  const statusCounts = new Map<string, number>();
  const orderVolumeByInterval = new Map<string, number>();
  const revenueByInterval = new Map<string, number>();
  const productRevenue = new Map<string, number>();

  for (const order of allOrders) {
    const normalizedStatus = normalizeStatus(order.status);
    statusCounts.set(normalizedStatus, (statusCounts.get(normalizedStatus) ?? 0) + 1);

    const intervalKey = getOrderGroupKey(order.date_created, filters.interval);
    orderVolumeByInterval.set(intervalKey, (orderVolumeByInterval.get(intervalKey) ?? 0) + 1);

    refundsTotal += Math.max(0, toNumber(order.total_refunded));

    if (!SALES_STATUSES.has(normalizedStatus)) {
      continue;
    }

    const orderTotal = Math.max(0, toNumber(order.total));
    const orderDiscount = Math.max(0, toNumber(order.discount_total));
    const orderShipping = Math.max(0, toNumber(order.shipping_total));
    const orderTaxes = Math.max(0, toNumber(order.total_tax));

    paidOrders += 1;
    grossRevenue += orderTotal;
    discountsTotal += orderDiscount;
    shippingTotal += orderShipping;
    taxesTotal += orderTaxes;
    revenueByInterval.set(intervalKey, (revenueByInterval.get(intervalKey) ?? 0) + orderTotal);

    for (const lineItem of Array.isArray(order.line_items) ? order.line_items : []) {
      const quantity = Math.max(0, toNumber(lineItem.quantity));
      const lineTotal = Math.max(0, toNumber(lineItem.total));
      const label = lineItem.name?.trim() || "item";

      itemsSold += quantity;
      productRevenue.set(label, (productRevenue.get(label) ?? 0) + lineTotal);
    }
  }

  const netRevenue = Math.max(0, grossRevenue - shippingTotal - taxesTotal - refundsTotal);
  const orderStatusSeries = Array.from(statusCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);

  const leaderboardBase = Array.from(productRevenue.entries())
    .map(([label, value]) => ({ label: label.toLowerCase(), value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
  const leaderboardTotal = leaderboardBase.reduce((sum, item) => sum + item.value, 0);

  return {
    avgOrderValue: paidOrders > 0 ? grossRevenue / paidOrders : 0,
    discountsTotal,
    errors,
    grossRevenue,
    itemsSold,
    leaderboard:
      leaderboardTotal > 0
        ? leaderboardBase.map((item) => ({
            ...item,
            share: Number(((item.value / leaderboardTotal) * 100).toFixed(1)),
          }))
        : [],
    netRevenue,
    orderStatusSeries,
    orderVolumeSeries: sortSeries(orderVolumeByInterval, filters),
    orders: allOrders.length,
    pagesFetched,
    refundsTotal,
    revenueSeries: sortSeries(revenueByInterval, filters),
    shippingTotal,
    taxesTotal,
    totalOrdersAvailable: firstPage.totalOrders,
    truncated,
  };
}
