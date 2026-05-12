import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminSalesAnalyticsSnapshot } from "@/lib/server/admin-sales-analytics";
import {
  parseAdminSalesFilters,
  type AdminSalesPageSearchParams,
} from "@/lib/server/admin-sales-filters";
import { getAdminSalesOrdersSnapshot } from "@/lib/server/admin-sales-orders";

import { SalesBarsChart, SalesDonutChart, SalesLineChart } from "../../charts";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatPercent,
} from "../../formatters";
import { CardNotification, CompactTable, MetricCard, Panel } from "../../primitives";
import { SalesFiltersPanel } from "./sales-filters-panel";
import { SalesOrdersPanel } from "./sales-orders-panel";

function classifyIssues(issues: string[]) {
  const revenue: string[] = [];
  const orders: string[] = [];
  const leaderboard: string[] = [];
  const paymentMix: string[] = [];
  const general: string[] = [];

  for (const issue of issues) {
    if (/revenue|reports\/sales/i.test(issue)) {
      revenue.push(issue);
    } else if (/orders\/stats|products\/stats/i.test(issue)) {
      orders.push(issue);
    } else if (/leaderboards|mais vendidos/i.test(issue)) {
      leaderboard.push(issue);
    } else if (/payment-mix|metodo de pagamento|mix de pagamento/i.test(issue)) {
      paymentMix.push(issue);
    } else {
      general.push(issue);
    }
  }

  return { revenue, orders, leaderboard, paymentMix, general };
}

export async function SalesContent({
  searchParams,
}: {
  searchParams?: AdminSalesPageSearchParams;
}) {
  const filters = parseAdminSalesFilters(searchParams);
  const session = await getServerSession(authOptions);
  const [analytics, ordersSnapshot] = await Promise.all([
    getAdminSalesAnalyticsSnapshot(session?.accessToken, filters),
    getAdminSalesOrdersSnapshot(session?.accessToken, filters),
  ]);

  const salesKpis = [
    {
      label: "Receita bruta",
      value: formatCompactCurrency(analytics.grossRevenue),
      detail: `Janela ${analytics.periodLabel}`,
      tone: "default" as const,
    },
    {
      label: "Receita liquida",
      value: formatCompactCurrency(analytics.netRevenue),
      detail: `Variacao ${formatPercent(analytics.revenueDeltaRate)}`,
      tone: "default" as const,
    },
    {
      label: "Pedidos no periodo",
      value: formatCompactNumber(analytics.orders),
      detail: "Mesmo filtro aplicado no historico abaixo.",
      tone: "default" as const,
    },
    {
      label: "Ticket medio",
      value: formatCompactCurrency(analytics.avgOrderValue),
      detail: "Receita bruta dividida pelo total de pedidos.",
      tone: "default" as const,
    },
    {
      label: "Itens vendidos",
      value: formatCompactNumber(analytics.itemsSold),
      detail: "Volume agregado de itens no recorte.",
      tone: "default" as const,
    },
    {
      label: "Descontos",
      value: formatCompactCurrency(analytics.discountsTotal),
      detail: "Total de cupons e descontos concedidos.",
      tone: "default" as const,
    },
    {
      label: "Frete",
      value: formatCompactCurrency(analytics.shippingTotal),
      detail: `Impostos ${formatCompactCurrency(analytics.taxesTotal)}`,
      tone: "default" as const,
    },
    {
      label: "Reembolsos",
      value: formatCompactCurrency(analytics.refundsTotal),
      detail: analytics.refundsTotal > 0 ? "Pedidos devolvidos no periodo." : "Sem reembolsos no periodo.",
      tone: analytics.refundsTotal > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  const leaderboardRows =
    analytics.leaderboard.length > 0
      ? analytics.leaderboard.map((row) => [
          row.label,
          formatCompactCurrency(row.value),
          formatPercent(row.share, 0),
        ])
      : [["sem dados", "R$ 0", "0%"]];

  const statusChartSeries =
    analytics.orderStatusSeries.length > 0 ? analytics.orderStatusSeries : analytics.orderVolumeSeries;
  const paymentMixSeries = analytics.paymentMixSeries;
  const allIssues = [...analytics.issues, ...ordersSnapshot.issues];
  const classified = classifyIssues(allIssues);
  const generalNotifications = [
    ...classified.general,
    ...(analytics.usedFallback
      ? ["Dados parciais: WooCommerce Analytics indisponivel ou incompleto; KPIs e graficos podem nao refletir o periodo inteiro."]
      : []),
  ];

  return (
    <>
      <SalesFiltersPanel filters={filters} notifications={generalNotifications} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {salesKpis.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <Panel className="flex flex-col overflow-hidden">
          <SalesLineChart
            label="receita por periodo"
            notifications={classified.revenue}
            points={analytics.revenueSeries}
          />
        </Panel>
        <Panel className="flex flex-col overflow-hidden">
          <SalesBarsChart
            label="pedidos por status"
            notifications={classified.orders}
            points={statusChartSeries}
          />
        </Panel>
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden pb-3">
          <div className="flex flex-col gap-3 border-b border-[#231f20]/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                Mais vendidos
              </p>
              <p className="mt-1 text-sm text-[#231f20]/66">
                Produtos e categorias com maior participacao na receita do periodo.
              </p>
            </div>
            <CardNotification issues={classified.leaderboard} />
          </div>
          <div className="px-2 pt-2">
            <CompactTable headers={["item", "receita", "share"]} rows={leaderboardRows} />
          </div>
        </Panel>
        <Panel className="flex flex-col overflow-hidden">
          <SalesDonutChart
            label="mix por metodo de pagamento"
            notifications={classified.paymentMix}
            points={paymentMixSeries}
          />
        </Panel>
      </div>

      <SalesOrdersPanel filters={filters} snapshot={ordersSnapshot} />
    </>
  );
}
