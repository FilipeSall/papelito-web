import { VendorPageHeader, VendorStockManager } from "@/components/layout/vendor-panel";
import { getVendorStock, type VendorStockFilter } from "@/features/vendor-stock/server";
import { firstParam } from "@/lib/search-params";

export default async function VendorStockPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawFilter = firstParam(params.filter);
  const filter: VendorStockFilter =
    rawFilter === "with_stock" || rawFilter === "zeroed_only" ? rawFilter : "all";
  const search = firstParam(params.search)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const focus = Number.parseInt(firstParam(params.focus) ?? "", 10);
  const snapshot = await getVendorStock({ filter, page, search });

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Atualize a disponibilidade por produto. Quando um saldo chega a zero, voce recebe uma notificacao operacional."
        eyebrow="Catalogo regional"
        signal="controle direto"
        title="Estoque"
      />
      <VendorStockManager
        filter={filter}
        focusProductId={Number.isInteger(focus) && focus > 0 ? focus : undefined}
        search={search}
        snapshot={snapshot}
      />
    </div>
  );
}
