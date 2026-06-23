import {
  VendorOnboardingRequiredNotice,
  VendorPageHeader,
  VendorStockManager,
} from "@/components/layout/vendor-panel";
import { getVendorPendingRegistrationState } from "@/features/revendedor/server/vendor-onboarding";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import {
  getVendorStock,
  getVendorStockTaxonomies,
  VENDOR_STOCK_SORTS,
  type VendorStockFilter,
  type VendorStockFilters,
  type VendorStockSort,
} from "@/features/vendor-stock/server";
import { firstParam } from "@/lib/search-params";

export default async function VendorStockPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const pendingState = await getVendorPendingRegistrationState();

  if (pendingState.pendingFields.length > 0) {
    return (
      <div className="space-y-4 md:space-y-5">
        <VendorPageHeader
          description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, voce recebe uma notificacao operacional."
          eyebrow="Catalogo regional"
          signal="cadastro pendente"
          title="Estoque"
        />
        <VendorOnboardingRequiredNotice
          body="Para visualizar e gerenciar seus produtos, complete o cadastro do vendor. Assim que os dados pendentes forem preenchidos, seu estoque fica disponivel aqui."
          href={buildVendorOnboardingHref("/vendor/estoque")}
          title="Complete o cadastro para ver seus produtos"
        />
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};

  const rawFilter = firstParam(params.filter);
  const filter: VendorStockFilter =
    rawFilter === "with_stock" || rawFilter === "zeroed_only" ? rawFilter : "all";

  const rawSort = firstParam(params.sort);
  const sort: VendorStockSort = VENDOR_STOCK_SORTS.includes(rawSort as VendorStockSort)
    ? (rawSort as VendorStockSort)
    : "name_asc";

  const rawCategory = Number.parseInt(firstParam(params.category) ?? "", 10);
  const category = Number.isInteger(rawCategory) && rawCategory > 0 ? rawCategory : null;

  const tags = (firstParam(params.tags) ?? "")
    .split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);

  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const focus = Number.parseInt(firstParam(params.focus) ?? "", 10);

  const filters: VendorStockFilters = { category, filter, search, sort, tags };

  const [snapshot, taxonomies] = await Promise.all([
    getVendorStock({ ...filters, page }),
    getVendorStockTaxonomies(),
  ]);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, voce recebe uma notificacao operacional."
        eyebrow="Catalogo regional"
        signal="controle direto"
        title="Estoque"
      />
      <VendorStockManager
        filters={filters}
        focusProductId={Number.isInteger(focus) && focus > 0 ? focus : undefined}
        snapshot={snapshot}
        taxonomies={taxonomies}
      />
    </div>
  );
}
