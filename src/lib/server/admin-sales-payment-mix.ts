import "server-only";

import type { AdminSalesFilters } from "@/lib/server/admin-sales-filters";
import { wpRest } from "@/lib/server/wp-rest";

const SALES_STATUSES = new Set(["processing", "completed", "refunded"]);
const SAMPLE_PER_PAGE = 100;

type WcOrderSample = {
  payment_method_title?: string | null;
  status?: string | null;
  total?: string | number | null;
};

export type AdminSalesPaymentMixPoint = {
  label: string;
  value: number;
};

export type AdminSalesPaymentMix = {
  errors: string[];
  ordersSampled: number;
  series: AdminSalesPaymentMixPoint[];
  totalOrdersAvailable: number;
  truncated: boolean;
};

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

export async function getAdminSalesPaymentMix(
  accessToken: string | undefined,
  filters: AdminSalesFilters,
): Promise<AdminSalesPaymentMix> {
  if (!accessToken) {
    return {
      errors: ["Sessao sem access token para amostrar metodos de pagamento."],
      ordersSampled: 0,
      series: [],
      totalOrdersAvailable: 0,
      truncated: false,
    };
  }

  const params = new URLSearchParams({
    after: filters.afterIso,
    before: filters.beforeIso,
    order: "desc",
    orderby: "date",
    page: "1",
    per_page: String(SAMPLE_PER_PAGE),
  });

  const result = await wpRest<WcOrderSample[]>(`/wc/v3/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 300,
    tags: ["admin-sales"],
  });

  if (!result.ok) {
    return {
      errors: [`payment-mix -> ${result.error.message}`],
      ordersSampled: 0,
      series: [],
      totalOrdersAvailable: 0,
      truncated: false,
    };
  }

  const totalAvailable =
    Number.parseInt(result.headers.get("X-WP-Total") ?? "0", 10) || 0;
  const orders = Array.isArray(result.data) ? result.data : [];

  const revenueByMethod = new Map<string, number>();

  for (const order of orders) {
    const status = order.status?.trim().toLowerCase() ?? "";
    if (!SALES_STATUSES.has(status)) {
      continue;
    }

    const method = order.payment_method_title?.trim() || "nao informado";
    const total = Math.max(0, toNumber(order.total));

    if (total <= 0) {
      continue;
    }

    revenueByMethod.set(method, (revenueByMethod.get(method) ?? 0) + total);
  }

  const sorted = Array.from(revenueByMethod.entries())
    .map(([label, value]) => ({ label: label.toLowerCase(), value }))
    .sort((left, right) => right.value - left.value);

  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const restTotal = rest.reduce((sum, item) => sum + item.value, 0);
  const series = restTotal > 0 ? [...top, { label: "outros", value: restTotal }] : top;

  return {
    errors: [],
    ordersSampled: orders.length,
    series,
    totalOrdersAvailable: totalAvailable,
    truncated: totalAvailable > orders.length,
  };
}
