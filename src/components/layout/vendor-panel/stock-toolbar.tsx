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
    <div className="flex flex-col gap-4 border-b border-brand-dark/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <form className="flex flex-1 gap-2" method="get">
        <input name="filter" type="hidden" value={filter} />
        <input
          className="h-11 w-full max-w-md rounded-[12px] border border-brand-dark/16 bg-white px-4 text-sm outline-none focus:border-brand-dark"
          defaultValue={search}
          name="search"
          placeholder="Buscar produto ou SKU"
        />
        <button className="rounded-[12px] bg-brand-dark px-5 text-sm font-semibold text-brand-yellow">
          Buscar
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(([value, label]) => (
          <Link
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              filter === value
                ? "border-brand-dark bg-brand-dark text-brand-yellow"
                : "border-brand-dark/14 bg-white text-brand-dark/65"
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
