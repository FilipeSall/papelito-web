import {
  CompactTable,
  MetricCard,
  SalesLineChart,
} from "@/components/layout/operational-panel";
import {
  VendorPageHeader,
  VendorPeriodFilters,
} from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorKpis } from "@/features/vendor-dashboard/server";
import { formatBRLIntl } from "@/lib/format-currency";
import { parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending("/vendor/dashboard");

  const filters = parseAdminSalesFilters(searchParams ? await searchParams : {});
  const snapshot = await getVendorKpis(filters);
  const topRows = snapshot.topProducts.map((product) => [
    product.name,
    `${product.qty} un.`,
    formatBRLIntl(product.revenue),
  ]);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Acompanhe sua operação Papelito: faturamento, pedidos aguardando tratamento e produtos com maior saída."
        eyebrow="Centro de operações"
        signal="seller ativo"
        title="Dashboard"
      />
      <VendorPeriodFilters basePath="/vendor/dashboard" filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail={`Janela ${filters.periodLabel}`} label="Faturamento" value={formatBRLIntl(snapshot.grossRevenue)} />
        <MetricCard detail="Média dos pedidos atendidos" label="Ticket médio" value={formatBRLIntl(snapshot.averageTicket)} />
        <MetricCard
          detail="Requerem separação ou envio"
          label="Pedidos pendentes"
          tone={snapshot.pendingOrders > 0 ? "warning" : "default"}
          value={String(snapshot.pendingOrders).padStart(2, "0")}
        />
        <MetricCard detail="Pedidos pagos no período" label="Pedidos" value={String(snapshot.ordersCount).padStart(2, "0")} />
        <MetricCard
          detail="Aguardando confirmação de pagamento"
          label="Aguardando pagamento"
          tone={snapshot.awaitingPaymentOrders > 0 ? "warning" : "default"}
          value={String(snapshot.awaitingPaymentOrders).padStart(2, "0")}
        />
      </div>
      <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SalesLineChart label="faturamento por período" points={snapshot.revenueSeries} />
        <section className="overflow-hidden rounded-[20px] border-2 border-brand-dark bg-[#fbf7ef] shadow-[8px_8px_0_rgba(35,31,32,0.08)]">
          <div className="border-b border-brand-dark/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-dark/48">Top produtos</p>
          </div>
          {topRows.length > 0 ? (
            <CompactTable headers={["Produto", "Qtd.", "Receita"]} rows={topRows} />
          ) : (
            <p className="px-5 py-10 text-sm text-brand-dark/62">Sem vendas no período selecionado.</p>
          )}
        </section>
      </div>
    </div>
  );
}
