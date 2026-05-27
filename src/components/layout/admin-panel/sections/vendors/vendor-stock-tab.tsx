import Link from "next/link";

import type { AdminVendorStockFilter, AdminVendorStockSnapshot } from "@/lib/server/admin-vendor-operations";

import { Panel } from "../../primitives";

import { type VendorDetailContext, vendorDetailHref } from "./vendor-detail-context";
import { VendorStockTable } from "./vendor-stock-table";

const STOCK_FILTERS: Array<[AdminVendorStockFilter, string]> = [
  ["all", "Todos"],
  ["with_stock", "Com estoque"],
  ["zeroed_only", "Zerados"],
];

export function VendorStockTab({
  ctx,
  snapshot,
}: {
  ctx: VendorDetailContext;
  snapshot: AdminVendorStockSnapshot | null;
}) {
  const { origin, stockFilters, vendorId } = ctx;
  const exportHref = `/api/admin/vendors/${vendorId}/stock/export?filter=${stockFilters.filter}${
    stockFilters.search ? `&search=${encodeURIComponent(stockFilters.search)}` : ""
  }`;

  return (
    <Panel className="space-y-4 p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-[#231f20]/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <form className="flex flex-1 gap-2" method="get">
          {origin.page > 1 ? (
            <input name="originPage" type="hidden" value={String(origin.page)} />
          ) : null}
          {origin.search ? <input name="originSearch" type="hidden" value={origin.search} /> : null}
          {origin.status && origin.status !== "pending" ? (
            <input name="originStatus" type="hidden" value={origin.status} />
          ) : null}
          <input name="tab" type="hidden" value="stock" />
          {stockFilters.filter !== "all" ? (
            <input name="stockFilter" type="hidden" value={stockFilters.filter} />
          ) : null}
          <input
            className="h-11 w-full max-w-md rounded-[12px] border border-[#231f20]/16 bg-white px-4 text-sm outline-none focus:border-[#231f20]"
            defaultValue={stockFilters.search}
            name="stockSearch"
            placeholder="Buscar produto ou SKU"
          />
          <button className="rounded-[12px] bg-[#231f20] px-5 text-sm font-semibold text-[#ffe500]">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {STOCK_FILTERS.map(([filter, label]) => (
            <Link
              key={filter}
              href={vendorDetailHref(ctx, { tab: "stock", stockFilters: { filter, page: 1 } })}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                stockFilters.filter === filter
                  ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
                  : "border-[#231f20]/14 bg-white text-[#231f20]/65"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            className="inline-flex items-center rounded-[12px] border border-[#231f20]/14 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#231f20]"
            href={exportHref}
          >
            Exportar CSV
          </a>
        </div>
      </div>

      {snapshot && snapshot.items.length > 0 ? (
        <>
          <VendorStockTable items={snapshot.items} vendorId={vendorId} />
          <div className="flex items-center justify-between text-sm text-[#231f20]/62">
            <span>{snapshot.total} produtos encontrados</span>
            <div className="flex items-center gap-2">
              {snapshot.page > 1 ? (
                <Link
                  className="rounded-[10px] border border-[#231f20]/16 px-3 py-2"
                  href={vendorDetailHref(ctx, {
                    tab: "stock",
                    stockFilters: { page: snapshot.page - 1 },
                  })}
                >
                  Anterior
                </Link>
              ) : null}
              <span>
                Pagina {snapshot.page} de {snapshot.totalPages}
              </span>
              {snapshot.page < snapshot.totalPages ? (
                <Link
                  className="rounded-[10px] border border-[#231f20]/16 px-3 py-2"
                  href={vendorDetailHref(ctx, {
                    tab: "stock",
                    stockFilters: { page: snapshot.page + 1 },
                  })}
                >
                  Proxima
                </Link>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#231f20]/62">Nenhum item encontrado para este filtro.</p>
      )}
    </Panel>
  );
}
