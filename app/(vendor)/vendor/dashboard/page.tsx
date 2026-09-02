import { SalesLineChart } from "@/components/layout/operational-panel";
import { HardPanel } from "@/components/layout/admin-panel/primitives";
import {
  VendorCustomersExportPanel,
  VendorSalesExportPanel,
} from "@/components/layout/admin-panel/sections/exports";
import {
  FigureLine,
  FigureList,
} from "@/components/layout/admin-panel/sections/sales/sales-figures";
import { SalesHeadline } from "@/components/layout/admin-panel/sections/sales/sales-headline";
import { SalesSectionNav } from "@/components/layout/admin-panel/sections/sales/sales-section-nav";
import { SalesSegmentFilter } from "@/components/layout/admin-panel/sections/sales/sales-segment-filter";
import { VendorPageHeader, VendorPeriodFilters } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorKpis } from "@/features/vendor-dashboard/server";
import { formatBRLIntl } from "@/lib/format-currency";
import {
  buildPreviousPeriodLabel,
  parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

const BASE_PATH = "/vendor/dashboard";

const PAGE_SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "faturamento", label: "Gráfico" },
  { id: "exportar-minhas-vendas", label: "Exportações" },
] as const;

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending(BASE_PATH);

  const filters = parseAdminSalesFilters(searchParams ? await searchParams : {});
  const snapshot = await getVendorKpis(filters);
  const deltaRate =
    snapshot.previousGrossRevenue !== null && snapshot.previousGrossRevenue > 0
      ? ((snapshot.grossRevenue - snapshot.previousGrossRevenue) /
          snapshot.previousGrossRevenue) *
        100
      : null;

  const figures: Array<{
    label: string;
    note?: string;
    tone?: "default" | "warning";
    value: string;
  }> = [
    {
      label: "Ticket médio",
      note: "Valor médio por pedido no recorte.",
      value: formatBRLIntl(snapshot.averageTicket),
    },
    {
      label: "Pedidos",
      note: "Pedidos que compõem o faturamento acima.",
      value: String(snapshot.ordersCount).padStart(2, "0"),
    },
    {
      label: "Pedidos pendentes",
      note: "Requerem separação ou envio.",
      tone: snapshot.pendingOrders > 0 ? "warning" : "default",
      value: String(snapshot.pendingOrders).padStart(2, "0"),
    },
    {
      label: "Aguardando pagamento",
      note: "Ainda sem confirmação do pagamento, então fora do faturamento.",
      tone: snapshot.awaitingPaymentOrders > 0 ? "warning" : "default",
      value: String(snapshot.awaitingPaymentOrders).padStart(2, "0"),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      <SalesSectionNav sections={PAGE_SECTIONS} />

      <VendorPageHeader
        description="Acompanhe sua operação Papelito: faturamento, pedidos aguardando tratamento, produtos com maior saída e as exportações da sua carteira."
        eyebrow="Centro de operações"
        signal="seller ativo"
        title="Dashboard"
      />

      <VendorPeriodFilters basePath={BASE_PATH} filters={filters} />

      <SalesSegmentFilter basePath={BASE_PATH} filters={filters} />

      <section
        aria-label="Resumo do período"
        className="grid items-stretch gap-4 scroll-mt-24 lg:grid-cols-2"
        id="resumo"
      >
        <HardPanel accent="black" className="flex h-full flex-col">
          <div className="flex-1 px-5 py-6 md:px-7">
            <SalesHeadline
              deltaRate={deltaRate}
              grossRevenue={snapshot.grossRevenue}
              label="Faturamento"
              periodLabel={filters.periodLabel}
              previousGrossRevenue={snapshot.previousGrossRevenue}
              previousPeriodLabel={buildPreviousPeriodLabel(filters.from, filters.to)}
            />
            <div className="mt-5">
              <FigureList>
                {figures.map((figure) => (
                  <FigureLine
                    key={figure.label}
                    label={figure.label}
                    note={figure.note}
                    tone={figure.tone}
                    value={figure.value}
                  />
                ))}
              </FigureList>
            </div>
          </div>
        </HardPanel>

        <HardPanel accent="black" className="flex h-full flex-col">
          <div className="flex-1 px-5 py-6 md:px-7">
            <div className="border-b-2 border-dashed border-[#1a1a1a]/28 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                Mais vendidos
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#1a1a1a]/72">
                Produtos com maior saída na sua operação no recorte.
              </p>
            </div>

            {snapshot.topProducts.length > 0 ? (
              <div className="mt-2">
                <FigureList>
                  {snapshot.topProducts.map((product) => (
                    <FigureLine
                      key={product.productId}
                      label={product.name}
                      value={`${formatBRLIntl(product.revenue)} · ${product.qty} un.`}
                    />
                  ))}
                </FigureList>
              </div>
            ) : (
              <p className="pt-5 text-sm leading-6 text-[#1a1a1a]/72">
                Sem vendas neste recorte, então não há ranking a montar.
              </p>
            )}
          </div>
        </HardPanel>
      </section>

      <div className="scroll-mt-24" id="faturamento">
        <SalesLineChart label="faturamento por período" points={snapshot.revenueSeries} />
      </div>

      <VendorSalesExportPanel pageFrom={filters.from} pageTo={filters.to} />

      <VendorCustomersExportPanel pageFrom={filters.from} pageTo={filters.to} />
    </div>
  );
}
