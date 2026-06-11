import { MetricCard, SalesLineChart } from "@/components/layout/operational-panel";
import { VendorPageHeader, VendorPeriodFilters, VendorRecipientPanel } from "@/components/layout/vendor-panel";
import { getVendorKpis } from "@/features/vendor-dashboard/server";
import { getVendorRecipient } from "@/features/vendor-recipient/services/get-vendor-recipient";
import { formatBRLIntl } from "@/lib/format-currency";
import { parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

export default async function VendorFinancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAdminSalesFilters(searchParams ? await searchParams : {});
  const [snapshot, recipient] = await Promise.all([
    getVendorKpis(filters),
    getVendorRecipient(),
  ]);

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
      <VendorRecipientPanel initialRecipient={recipient} />
      <SalesLineChart label="faturamento registrado" points={snapshot.revenueSeries} />
    </div>
  );
}
