"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  VendorStockFilters,
  VendorStockSort,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";
import { VENDOR_STOCK_SORTS } from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";
import { STOCK_SORT_LABELS } from "./stock-labels";
import { StockFilterDrawer } from "./stock-filter-drawer";

function countActive(filters: VendorStockFilters) {
  let count = 0;
  if (filters.filter !== "all") count += 1;
  if (filters.category && filters.category > 0) count += 1;
  if (filters.collection) count += 1;
  if (filters.type !== "products") count += 1;
  count += filters.tags.length;
  if (filters.sort !== "name_asc") count += 1;
  return count;
}

const sortOptions = VENDOR_STOCK_SORTS.map((value) => ({
  label: STOCK_SORT_LABELS[value],
  value,
}));

/**
 * Busca, ordenação e a porta do drawer.
 *
 * A ordenação fica visível, e não dentro do drawer: "quem está acabando primeiro" é a pergunta
 * mais frequente dessa tela, e esconder a resposta atrás de dois cliques era o que tornava a
 * conferência de estoque um trabalho.
 *
 * O formulário continua sendo um GET de verdade — os campos que o select controla viajam em
 * `input hidden` —, então a busca funciona mesmo se o JavaScript falhar.
 */
export function StockToolbar({
  filters,
  taxonomies,
}: {
  filters: VendorStockFilters;
  taxonomies: VendorStockTaxonomies;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState(filters.search);
  const active = countActive(filters);

  return (
    <div className="flex flex-col gap-3 border-b-2 border-[#1a1a1a] bg-brand-yellow/18 px-5 py-4 lg:flex-row lg:items-end">
      <form className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <input name="filter" type="hidden" value={filters.filter} />
        {filters.category && filters.category > 0 ? (
          <input name="category" type="hidden" value={String(filters.category)} />
        ) : null}
        {filters.tags.length > 0 ? (
          <input name="tags" type="hidden" value={filters.tags.join(",")} />
        ) : null}
        {filters.collection ? (
          <input name="collection" type="hidden" value={filters.collection} />
        ) : null}
        {filters.type !== "products" ? (
          <input name="type" type="hidden" value={filters.type} />
        ) : null}
        {filters.sort !== "name_asc" ? (
          <input name="sort" type="hidden" value={filters.sort} />
        ) : null}

        <div className="flex flex-1 flex-col gap-2">
          <label
            className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
            htmlFor="stock-search"
          >
            <span className="flex h-4 items-center">Busca</span>
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/45"
              strokeWidth={2.2}
            />
            <input
              className={[
                "h-11 w-full max-w-md border-2 border-[#1a1a1a] bg-white pl-9 pr-9 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                FOCUS_RING,
              ].join(" ")}
              id="stock-search"
              name="search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome do produto ou SKU"
              type="search"
              value={search}
            />
            {search ? (
              <button
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[#1a1a1a]/55 transition hover:text-[#1a1a1a]"
                onClick={() => {
                  setSearch("");
                  router.push(buildStockHref({ ...filters, search: "" }));
                }}
                type="button"
              >
                <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              </button>
            ) : null}
          </div>
        </div>

        <button
          className={[
            "inline-flex h-11 flex-none items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none",
            FOCUS_RING,
          ].join(" ")}
          type="submit"
        >
          Buscar
        </button>
      </form>

      <div className="w-full min-w-0 sm:w-56">
        <CheckoutCustomSelect
          label="Ordenar"
          labelClassName="text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
          onChange={(value) =>
            router.push(buildStockHref({ ...filters, sort: value as VendorStockSort }))
          }
          options={sortOptions}
          placeholder="Nome (A-Z)"
          triggerClassName="min-h-11 rounded-none border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]"
          value={filters.sort}
        />
      </div>

      <button
        className={[
          "inline-flex h-11 flex-none items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-white px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] transition hover:bg-brand-yellow",
          FOCUS_RING,
        ].join(" ")}
        onClick={() => setDrawerOpen(true)}
        type="button"
      >
        <SlidersHorizontal aria-hidden className="h-4 w-4" strokeWidth={2.4} />
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
