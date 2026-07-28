import { MetricCard, SalesLineChart } from "@/components/layout/operational-panel";
import { VendorPageHeader, VendorPeriodFilters } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorKpis } from "@/features/vendor-dashboard/server";
import { formatBRLIntl } from "@/lib/format-currency";
import { parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

export default async function VendorFinancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending("/vendor/financeiro");

  const filters = parseAdminSalesFilters(searchParams ? await searchParams : {});
  const snapshot = await getVendorKpis(filters);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Acompanhe valores dos pedidos atendidos por sua operação. Repasses e divisão de pagamentos não fazem parte desta fase."
        eyebrow="Visão financeira"
        signal="somente leitura"
        title="Financeiro"
      />
      <VendorPeriodFilters basePath="/vendor/financeiro" filters={filters} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail={`Pedidos pagos - ${filters.periodLabel}`} label="Faturamento bruto" value={formatBRLIntl(snapshot.grossRevenue)} />
        <MetricCard detail="Valor médio por pedido pago" label="Ticket médio" value={formatBRLIntl(snapshot.averageTicket)} />
        <MetricCard detail="Pedidos com pagamento confirmado" label="Pedidos contabilizados" value={String(snapshot.ordersCount)} />
        <MetricCard
          detail="Aguardando confirmação de pagamento"
          label="Aguardando pagamento"
          tone={snapshot.awaitingPaymentOrders > 0 ? "warning" : "default"}
          value={String(snapshot.awaitingPaymentOrders)}
        />
      </div>
      <SalesLineChart label="faturamento registrado" points={snapshot.revenueSeries} />
    </div>
  );
}
