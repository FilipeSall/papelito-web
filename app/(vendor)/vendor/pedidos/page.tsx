import { VendorOrdersTable, VendorPageHeader } from "@/components/layout/vendor-panel";
import { getVendorOrders, type VendorOrderStatus } from "@/features/vendor-orders/server";
import { firstParam } from "@/lib/search-params";

function parseStatus(value: string | undefined): VendorOrderStatus | "all" {
  return value === "aguardando_envio" ||
    value === "em_separacao" ||
    value === "enviado" ||
    value === "entregue" ||
    value === "cancelado"
    ? value
    : "all";
}

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const status = parseStatus(firstParam(params.status));
  const snapshot = await getVendorOrders({ page, search, status });

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Consulte pedidos atendidos por sua loja e avance o fluxo de separacao e entrega no detalhe de cada venda."
        eyebrow="Atendimento"
        signal="pedidos"
        title="Pedidos"
      />
      <VendorOrdersTable search={search} snapshot={snapshot} status={status} />
    </div>
  );
}
