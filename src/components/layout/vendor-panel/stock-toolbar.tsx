"use client";

import { useState } from "react";

import type {
  VendorStockFilters,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

import { StockFilterDrawer } from "./stock-filter-drawer";

function countActive(filters: VendorStockFilters) {
  let count = 0;
  if (filters.filter !== "all") count += 1;
  if (filters.category && filters.category > 0) count += 1;
  count += filters.tags.length;
  if (filters.sort !== "name_asc") count += 1;
  return count;
}

export function StockToolbar({
  filters,
  taxonomies,
}: {
  filters: VendorStockFilters;
  taxonomies: VendorStockTaxonomies;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const active = countActive(filters);

  return (
    <div className="flex flex-col gap-4 border-b-2 border-[#1a1a1a] bg-brand-yellow/18 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <form className="flex flex-1 flex-col gap-2 sm:flex-row" method="get">
        <input name="filter" type="hidden" value={filters.filter} />
        {filters.category && filters.category > 0 ? (
          <input name="category" type="hidden" value={String(filters.category)} />
        ) : null}
        {filters.tags.length > 0 ? <input name="tags" type="hidden" value={filters.tags.join(",")} /> : null}
        {filters.sort !== "name_asc" ? <input name="sort" type="hidden" value={filters.sort} /> : null}
        <input
          className="h-11 w-full max-w-md border-2 border-[#1a1a1a] bg-white px-4 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
          defaultValue={filters.search}
          name="search"
          placeholder="Buscar produto ou SKU"
        />
        <button className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2">
          Buscar
        </button>
      </form>
      <button
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
        onClick={() => setDrawerOpen(true)}
        type="button"
      >
        Filtrar{active > 0 ? ` · ${active}` : ""}
      </button>
      <StockFilterDrawer
        filters={filters}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        taxonomies={taxonomies}
      />
    </div>
  );
}
