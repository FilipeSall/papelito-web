import { VendorOrdersBoard, VendorPageHeader } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorOrders } from "@/features/vendor-orders/server";
import type { VendorOrdersFilters } from "@/features/vendor-orders/types/vendor-orders";
import {
  normalizeVendorOrdersFiscal,
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
  await redirectIfVendorOnboardingPending("/vendor/pedidos");

  const params = searchParams ? await searchParams : {};
  const initialFilters: VendorOrdersFilters = {
    fiscal: normalizeVendorOrdersFiscal(firstParam(params.fiscal)),
    page: parseVendorOrdersPage(firstParam(params.page)),
    search: parseVendorOrdersSearch(firstParam(params.search)),
    status: normalizeVendorOrdersStatus(firstParam(params.status)),
  };
  const snapshot = await getVendorOrders(initialFilters);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Fila de trabalho da sua loja: escolha a situação para abrir o recorte, e entre no pedido para avançar o status, registrar a postagem e anexar a nota fiscal."
        eyebrow="Atendimento"
        signal="pedidos"
        title="Pedidos"
      />
      <VendorOrdersBoard initialFilters={initialFilters} initialSnapshot={snapshot} />
    </div>
  );
}
