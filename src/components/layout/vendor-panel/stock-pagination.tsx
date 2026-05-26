import Link from "next/link";

import type { VendorStockFilter } from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";

export function StockPagination({
  filter,
  page,
  search,
  total,
  totalPages,
}: {
  filter: VendorStockFilter;
  page: number;
  search: string;
  total: number;
  totalPages: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm text-brand-dark/62">
      <span>{total} produtos encontrados</span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link className="rounded-[10px] border border-brand-dark/16 px-3 py-2" href={buildStockHref(filter, search, page - 1)}>
            Anterior
          </Link>
        ) : null}
        <span>Pagina {page} de {totalPages}</span>
        {page < totalPages ? (
          <Link className="rounded-[10px] border border-brand-dark/16 px-3 py-2" href={buildStockHref(filter, search, page + 1)}>
            Proxima
          </Link>
        ) : null}
      </div>
    </div>
  );
}
