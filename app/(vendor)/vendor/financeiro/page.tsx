import { MetricCard, SalesLineChart } from "@/components/layout/operational-panel";
import { VendorPageHeader, VendorPeriodFilters } from "@/components/layout/vendor-panel";
import { getVendorKpis } from "@/features/vendor-dashboard/server";
import { formatBRLIntl } from "@/lib/format-currency";
import { parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

export default async function VendorFinancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminSalesFilters(searchParams ? await searchParams : {});
  const snapshot = await getVendorKpis(filters);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Acompanhe valores dos pedidos atendidos por sua operacao. Repasses e divisao de pagamentos nao fazem parte desta fase."
        eyebrow="Visao financeira"
        signal="somente leitura"
        title="Financeiro"
      />
      <VendorPeriodFilters basePath="/vendor/financeiro" filters={filters} />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard detail={`Janela ${filters.periodLabel}`} label="Faturamento bruto" value={formatBRLIntl(snapshot.grossRevenue)} />
        <MetricCard detail="Valor medio por pedido" label="Ticket medio" value={formatBRLIntl(snapshot.averageTicket)} />
        <MetricCard detail="Pedidos nao cancelados" label="Pedidos contabilizados" value={String(snapshot.ordersCount)} />
      </div>
      <SalesLineChart label="faturamento registrado" points={snapshot.revenueSeries} />
    </div>
  );
}
