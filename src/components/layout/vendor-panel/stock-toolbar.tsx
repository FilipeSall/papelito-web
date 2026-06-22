import Link from "next/link";

import type { VendorStockFilter } from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";

const filterOptions: Array<[VendorStockFilter, string]> = [
  ["all", "Todos"],
  ["with_stock", "Com estoque"],
  ["zeroed_only", "Zerados"],
];

export function StockToolbar({
  filter,
  search,
}: {
  filter: VendorStockFilter;
  search: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b-2 border-[#1a1a1a] bg-brand-yellow/18 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <form className="flex flex-1 flex-col gap-2 sm:flex-row" method="get">
        <input name="filter" type="hidden" value={filter} />
        <input
          className="h-11 w-full max-w-md border-2 border-[#1a1a1a] bg-white px-4 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
          defaultValue={search}
          name="search"
          placeholder="Buscar produto ou SKU"
        />
        <button className="inline-flex h-11 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2">
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(([value, label]) => (
          <Link
            className={`inline-flex min-h-10 items-center justify-center border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 ${
              filter === value
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                : "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow"
            }`}
            href={buildStockHref(value, search)}
            key={value}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
