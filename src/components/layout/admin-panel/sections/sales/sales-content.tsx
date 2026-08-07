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
  formatPercent,
} from "../../formatters";
import { CardNotification, CompactTable, FramedPanel } from "../../primitives";
import { SalesFiltersPanel } from "./sales-filters-panel";
import { SalesMetricCard } from "./sales-metric-card";
import { SalesOrdersPanel } from "./sales-orders-panel";

function classifyIssues(issues: string[]) {
  const revenue: string[] = [];
  const orders: string[] = [];
  const leaderboard: string[] = [];
  const paymentMix: string[] = [];
  const general: string[] = [];

  for (const issue of issues) {
    if (/revenue|reports\/sales|sales\/snapshot/i.test(issue)) {
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
}: Readonly<{
  searchParams?: AdminSalesPageSearchParams;
}>) {
  const filters = parseAdminSalesFilters(searchParams);
  const session = await getServerSession(authOptions);
  const [analytics, ordersSnapshot] = await Promise.all([
    getAdminSalesAnalyticsSnapshot(session?.accessToken, filters),
    getAdminSalesOrdersSnapshot(session?.accessToken, filters),
  ]);

  const salesKpis = [
    {
      format: "currency" as const,
      label: "Receita bruta",
      value: analytics.grossRevenue,
      detail: `Vendas confirmadas na janela ${analytics.periodLabel}`,
      tone: "default" as const,
    },
    {
      format: "currency" as const,
      label: "Receita líquida",
      value: analytics.netRevenue,
      detail: `Vendas confirmadas menos reembolsos. Variação ${formatPercent(analytics.revenueDeltaRate)}`,
      tone: "default" as const,
    },
    {
      format: "number" as const,
      label: "Pedidos criados",
      value: ordersSnapshot.totalOrders,
      detail: "Mesmo período e mesma consulta do histórico abaixo.",
      tone: "default" as const,
    },
    {
      format: "number" as const,
      label: "Vendas confirmadas",
      value: analytics.orders,
      detail: "Pedidos com pagamento confirmado.",
      tone: "default" as const,
    },
    {
      format: "currency" as const,
      label: "Ticket médio",
      value: analytics.avgOrderValue,
      detail: "Receita bruta dividida pelas vendas confirmadas.",
      tone: "default" as const,
    },
    {
      format: "number" as const,
      label: "Itens vendidos",
      value: analytics.itemsSold,
      detail: "Itens de vendas com pagamento confirmado.",
      tone: "default" as const,
    },
    {
      format: "currency" as const,
      label: "Descontos",
      value: analytics.discountsTotal,
      detail: "Total de cupons e descontos concedidos.",
      tone: "default" as const,
    },
    {
      format: "currency" as const,
      label: "Frete",
      value: analytics.shippingTotal,
      detail: `Impostos ${formatCompactCurrency(analytics.taxesTotal)}`,
      tone: "default" as const,
    },
    {
      format: "currency" as const,
      label: "Reembolsos",
      value: analytics.refundsTotal,
      detail: analytics.refundsTotal > 0 ? "Pedidos devolvidos no período." : "Sem reembolsos no período.",
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
      ? ["Dados indisponíveis: não foi possível consultar o snapshot financeiro completo do período."]
      : []),
  ];
  const animationKey = `${filters.preset}-${filters.from}-${filters.to}-${filters.interval}`;

  return (
    <>
      <SalesFiltersPanel filters={filters} notifications={generalNotifications} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {salesKpis.map((card, index) => (
          <SalesMetricCard
            key={card.label}
            {...card}
            animationDelayMs={80 + index * 45}
          />
        ))}
      </div>

      <div className="animate-admin-panel-enter grid items-stretch gap-4 xl:grid-cols-2 [animation-delay:220ms]">
        <SalesLineChart
          emptyMessage="Nenhuma venda confirmada no período."
          key={`revenue-${animationKey}`}
          label="receita por período"
          notifications={classified.revenue}
          points={analytics.revenueSeries}
        />
        <SalesBarsChart
          key={`status-${animationKey}`}
          label="pedidos por status"
          notifications={classified.orders}
          points={statusChartSeries}
        />
      </div>

      <div className="animate-admin-panel-enter grid items-stretch gap-4 xl:grid-cols-[1.15fr_0.85fr] [animation-delay:320ms]">
        <FramedPanel className="overflow-hidden pb-3">
          <div className="flex flex-col gap-3 border-b border-[#231f20]/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                Mais vendidos
              </p>
              <p className="mt-1 text-sm text-[#231f20]/66">
                Produtos e categorias com maior participação na receita do período.
              </p>
            </div>
            <CardNotification issues={classified.leaderboard} />
          </div>
          <div className="px-2 pt-2">
            <CompactTable headers={["item", "receita", "share"]} rows={leaderboardRows} />
          </div>
        </FramedPanel>
        <SalesDonutChart
          key={`payment-${animationKey}`}
          label="mix por método de pagamento"
          notifications={classified.paymentMix}
          points={paymentMixSeries}
        />
      </div>

      <div className="animate-admin-panel-enter [animation-delay:420ms]">
        <SalesOrdersPanel filters={filters} snapshot={ordersSnapshot} />
      </div>
    </>
  );
}
