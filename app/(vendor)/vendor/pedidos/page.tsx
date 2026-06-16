import { VendorOrdersTable, VendorPageHeader } from "@/components/layout/vendor-panel";
import { getVendorOrders } from "@/features/vendor-orders/server";
import type { VendorOrdersFilters } from "@/features/vendor-orders/types/vendor-orders";
import {
  normalizeVendorOrdersStatus,
  parseVendorOrdersPage,
  parseVendorOrdersSearch,
} from "@/features/vendor-orders/utils/vendor-order-filters";
import { firstParam } from "@/lib/search-params";

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialFilters: VendorOrdersFilters = {
    page: parseVendorOrdersPage(firstParam(params.page)),
    search: parseVendorOrdersSearch(firstParam(params.search)),
    status: normalizeVendorOrdersStatus(firstParam(params.status)),
  };
  const snapshot = await getVendorOrders(initialFilters);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Consulte pedidos atendidos por sua loja e avance o fluxo de separacao e entrega no detalhe de cada venda."
        eyebrow="Atendimento"
        signal="pedidos"
        title="Pedidos"
      />
      <VendorOrdersTable initialFilters={initialFilters} initialSnapshot={snapshot} />
    </div>
  );
}
