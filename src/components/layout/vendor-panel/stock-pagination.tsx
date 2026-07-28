import Link from "next/link";

import type { VendorStockFilters } from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";

export function StockPagination({
  filters,
  page,
  total,
  totalPages,
}: {
  filters: VendorStockFilters;
  page: number;
  total: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-t-2 border-[#1a1a1a] bg-brand-yellow/12 px-5 py-4 text-sm text-[#1a1a1a]/72 md:flex-row md:items-center md:justify-between">
      <span className="text-[11px] font-black uppercase tracking-[0.16em]">{total} produtos encontrados</span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            className="inline-flex h-10 min-w-10 items-center justify-center border-2 border-[#1a1a1a] bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            href={buildStockHref(filters, page - 1)}
          >
            Anterior
          </Link>
        ) : null}
        <span className="text-xs font-semibold text-[#1a1a1a]">
          Página {page} de {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            className="inline-flex h-10 min-w-10 items-center justify-center border-2 border-[#1a1a1a] bg-white px-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            href={buildStockHref(filters, page + 1)}
          >
            Próxima
          </Link>
        ) : null}
      </div>
    </div>
  );
}
