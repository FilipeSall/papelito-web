import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminSalesAnalyticsSnapshot } from "@/lib/server/admin-sales-analytics";
import {
  buildPreviousPeriodLabel,
  parseAdminSalesFilters,
  type AdminSalesPageSearchParams,
} from "@/lib/server/admin-sales-filters";
import { getAdminSalesOrdersSnapshot } from "@/lib/server/admin-sales-orders";

import { SalesBarsChart, SalesDonutChart, SalesLineChart } from "../../charts";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "../../formatters";
import { CardNotification, HardPanel } from "../../primitives";
import { SalesExportPanel, UsersExportPanel } from "../exports";
import { FigureLine, FigureList } from "./sales-figures";
import { SalesHeadline } from "./sales-headline";
import { SalesOrdersPanel } from "./sales-orders-panel";
import { SalesSectionNav } from "./sales-section-nav";
import { SalesSegmentFilter } from "./sales-segment-filter";
import { SalesWindowBar } from "./sales-window-bar";

const PAGE_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "graficos", label: "Gráficos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "exportar-vendas", label: "Exportações" },
] as const;

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

  const totals: Array<{
    label: string;
    note?: string;
    tone?: "default" | "warning";
    value: string;
  }> = [
    {
      label: "Pedidos criados",
      note: "Mesma janela e mesma consulta da lista de pedidos.",
      value: formatCompactNumber(ordersSnapshot.totalOrders),
    },
    {
      label: "Vendas no recorte",
      note: "Pedidos que compõem a receita deste tipo de venda.",
      value: formatCompactNumber(analytics.orders),
    },
    { label: "Ticket médio", value: formatCurrency(analytics.avgOrderValue) },
    { label: "Itens vendidos", value: formatCompactNumber(analytics.itemsSold) },
    {
      label: "Descontos",
      note: "Cupons e descontos concedidos no período.",
      value: formatCompactCurrency(analytics.discountsTotal),
    },
    {
      label: "Frete",
      note: `Impostos ${formatCompactCurrency(analytics.taxesTotal)}`,
      value: formatCompactCurrency(analytics.shippingTotal),
    },
    {
      label: "Reembolsos",
      note:
        analytics.refundsTotal > 0
          ? "Pedidos devolvidos no período."
          : "Sem reembolsos no período.",
      tone: analytics.refundsTotal > 0 ? "warning" : "default",
      value: formatCompactCurrency(analytics.refundsTotal),
    },
  ];

  const statusChartSeries =
    analytics.orderStatusSeries.length > 0
      ? analytics.orderStatusSeries
      : analytics.orderVolumeSeries;
  const allIssues = [...analytics.issues, ...ordersSnapshot.issues];
  const classified = classifyIssues(allIssues);
  const generalNotifications = [
    ...classified.general,
    ...(analytics.usedFallback
      ? ["Dados indisponíveis: não foi possível consultar o snapshot financeiro completo do período."]
      : []),
  ];
  const animationKey = `${filters.preset}-${filters.from}-${filters.to}-${filters.interval}-${filters.segment}`;

  return (
    <>
      <SalesSectionNav sections={PAGE_SECTIONS} />

      <SalesWindowBar filters={filters} notifications={generalNotifications} />

      <SalesSegmentFilter filters={filters} />

      <section
        aria-label="Resumo do período"
        className="animate-admin-panel-enter grid items-stretch gap-4 scroll-mt-24 [animation-delay:110ms] lg:grid-cols-2"
        id="resumo"
      >
        <HardPanel accent="black" className="flex h-full flex-col">
          <div className="flex-1 px-5 py-6 md:px-7">
            <SalesHeadline
              deltaRate={analytics.revenueDeltaRate}
              grossRevenue={analytics.grossRevenue}
              netRevenue={analytics.netRevenue}
              periodLabel={filters.periodLabel}
              previousGrossRevenue={analytics.previousGrossRevenue}
              previousPeriodLabel={buildPreviousPeriodLabel(filters.from, filters.to)}
            />
            <div className="mt-5">
              <FigureList>
                {totals.map((total) => (
                  <FigureLine
                    key={total.label}
                    label={total.label}
                    note={total.note}
                    tone={total.tone}
                    value={total.value}
                  />
                ))}
              </FigureList>
            </div>
          </div>
        </HardPanel>

        <HardPanel accent="black" className="flex h-full flex-col">
          <div className="flex-1 px-5 py-6 md:px-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-dashed border-[#1a1a1a]/28 pb-4">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                  Mais vendidos
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#1a1a1a]/72">
                  Participação de cada item na receita do recorte.
                </p>
              </div>
              <CardNotification issues={classified.leaderboard} />
            </div>

            {analytics.leaderboard.length > 0 ? (
              <div className="mt-2">
                <FigureList>
                  {analytics.leaderboard.map((row) => (
                    <FigureLine
                      key={row.label}
                      label={row.label}
                      value={`${formatCompactCurrency(row.value)} · ${formatPercent(row.share, 0)}`}
                    />
                  ))}
                </FigureList>
              </div>
            ) : (
              <p className="pt-5 text-sm leading-6 text-[#1a1a1a]/72">
                Nenhuma venda neste recorte, então não há ranking a montar.
              </p>
            )}
          </div>
        </HardPanel>
      </section>

      <div className="scroll-mt-24 space-y-4" id="graficos">
        <div className="animate-admin-panel-enter [animation-delay:200ms]">
          <SalesLineChart
            emptyMessage="Nenhuma venda no recorte selecionado."
            key={`revenue-${animationKey}`}
            label="receita por período"
            notifications={classified.revenue}
            points={analytics.revenueSeries}
          />
        </div>

        <div className="animate-admin-panel-enter grid items-stretch gap-4 [animation-delay:280ms] xl:grid-cols-[1.15fr_0.85fr]">
          <SalesBarsChart
            key={`status-${animationKey}`}
            label="pedidos por status"
            notifications={classified.orders}
            points={statusChartSeries}
          />
          <SalesDonutChart
            key={`payment-${animationKey}`}
            label="mix por método de pagamento"
            notifications={classified.paymentMix}
            points={analytics.paymentMixSeries}
          />
        </div>
      </div>

      <div className="animate-admin-panel-enter scroll-mt-24 [animation-delay:360ms]" id="pedidos">
        <SalesOrdersPanel filters={filters} snapshot={ordersSnapshot} />
      </div>

      <div className="animate-admin-panel-enter [animation-delay:440ms]">
        <SalesExportPanel pageFrom={filters.from} pageTo={filters.to} />
      </div>

      <div className="animate-admin-panel-enter [animation-delay:500ms]">
        <UsersExportPanel pageFrom={filters.from} pageTo={filters.to} />
      </div>
    </>
  );
}
