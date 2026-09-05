"use client";

import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useId, useState, type SubmitEvent } from "react";

import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from "@/constants/admin-products";
import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type { ProductFilters } from "@/types/admin-products-manager";

import { FOCUS_RING } from "../../../primitives";

import { ProductsFilterDrawer } from "./products-filter-drawer";

type ProductsFiltersProps = {
  appliedFilters: ProductFilters;
  categories: AdminCategory[];
  filters: ProductFilters;
  isLoading: boolean;
  isBackfillingSkus?: boolean;
  onApply: (filters: ProductFilters) => void;
  onBackfillSkus?: () => void;
  onCreateNew: () => void;
  onUpdateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
};

/**
 * O recorte é plural porque nomeia um conjunto; o select do editor continua no singular, porque
 * nomeia a situação de um produto só.
 */
const STATUS_FILTER_LABELS: Record<string, string> = {
  "": "Todos",
  draft: "Rascunhos",
  pending: "Pendentes",
  private: "Privados",
  publish: "Publicados",
};

function labelFor(options: readonly { label: string; value: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * Pílula de filtro aplicado. Só aparece para filtro realmente ativo, e remover é a própria pílula
 * — não há um segundo lugar onde desfazer a mesma coisa.
 */
function AppliedChip({ label, onRemove, value }: { label: string; onRemove: () => void; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white py-1 pl-3 pr-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
      <span className="text-[#1a1a1a]/55">{label}</span>
      <span className="max-w-45 truncate">{value}</span>
      <button
        aria-label={`Remover filtro ${label}`}
        className={[
          "inline-flex h-5 w-5 items-center justify-center border-2 border-transparent text-[#1a1a1a]/60 transition hover:border-[#1a1a1a] hover:text-[#1a1a1a]",
          FOCUS_RING,
        ].join(" ")}
        onClick={onRemove}
        type="button"
      >
        <X aria-hidden className="h-3 w-3" strokeWidth={3} />
      </button>
    </span>
  );
}

export function ProductsFilters({
  appliedFilters,
  categories,
  filters,
  isBackfillingSkus = false,
  isLoading,
  onApply,
  onBackfillSkus,
  onCreateNew,
  onUpdateFilter,
}: ProductsFiltersProps) {
  const panelId = useId();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Categoria da taxonomia Papelito, não termo do WooCommerce. Categoria
  // arquivada não é oferecida como filtro novo.
  const categoryOptions = [
    { label: "Todas as categorias", value: "" },
    ...categories
      .filter((category) => category.isActive && !category.archivedAt)
      .map((category) => ({ label: category.name, value: String(category.id) })),
  ];

  const extraFilterCount =
    (appliedFilters.category ? 1 : 0) +
    (appliedFilters.stockStatus ? 1 : 0) +
    (appliedFilters.status ? 1 : 0) +
    (appliedFilters.incomplete ? 1 : 0);
  const hasAnyApplied = Boolean(appliedFilters.search) || extraFilterCount > 0;

  function applyDraft(patch: Partial<ProductFilters>) {
    onApply({ ...filters, ...patch });
  }

  function applyApplied(patch: Partial<ProductFilters>) {
    onApply({ ...appliedFilters, ...patch });
  }

  function handleSearchSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    applyDraft({});
  }

  /**
   * Abre e fecha a gaveta de filtros. Abrir recomeça do que está aplicado, para que um rascunho
   * abandonado antes não volte como se fosse escolha do administrador.
   */
  function togglePanel() {
    if (isPanelOpen) {
      setIsPanelOpen(false);
      return;
    }

    onUpdateFilter("category", appliedFilters.category);
    onUpdateFilter("stockStatus", appliedFilters.stockStatus);
    onUpdateFilter("status", appliedFilters.status);
    onUpdateFilter("incomplete", appliedFilters.incomplete);
    setIsPanelOpen(true);
  }

  return (
    <div className="space-y-3">
      <form className="flex flex-col gap-3 lg:flex-row lg:items-center" onSubmit={handleSearchSubmit}>
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="products-search">
            Buscar produto
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]/45"
            strokeWidth={2.2}
          />
          <input
            className={[
              "h-13 w-full rounded-none border-2 border-[#1a1a1a] bg-white pl-12 pr-11 text-base text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
              FOCUS_RING,
            ].join(" ")}
            id="products-search"
            onChange={(event) => onUpdateFilter("search", event.target.value)}
            placeholder="Buscar por nome, SKU ou slug"
            type="search"
            value={filters.search}
          />
          {filters.search ? (
            <button
              aria-label="Limpar busca"
              className={[
                "absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#1a1a1a]/55 transition hover:text-[#1a1a1a]",
                FOCUS_RING,
              ].join(" ")}
              onClick={() => applyApplied({ search: "" })}
              type="button"
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={2.6} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-controls={panelId}
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            className={[
              "inline-flex h-13 items-center gap-2 border-2 border-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.18em] transition",
              FOCUS_RING,
              isPanelOpen || extraFilterCount > 0
                ? "bg-brand-yellow text-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
            ].join(" ")}
            onClick={togglePanel}
            type="button"
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" strokeWidth={2.2} />
            Filtros
            {extraFilterCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center border border-[#1a1a1a] px-1 text-[10px] tabular-nums">
                {extraFilterCount}
              </span>
            ) : null}
          </button>

          <button
            className={[
              "inline-flex h-13 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none",
              FOCUS_RING,
            ].join(" ")}
            onClick={onCreateNew}
            type="button"
          >
            <Plus aria-hidden className="h-4 w-4" strokeWidth={3} />
            Novo produto
          </button>

          {onBackfillSkus ? (
            <button
              className={[
                "inline-flex h-13 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.15em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50",
                FOCUS_RING,
              ].join(" ")}
              disabled={isBackfillingSkus || isLoading}
              onClick={onBackfillSkus}
              type="button"
            >
              {isBackfillingSkus ? "Gerando SKUs..." : "Gerar SKUs ausentes"}
            </button>
          ) : null}
        </div>
      </form>

      <ProductsFilterDrawer
        appliedFilters={appliedFilters}
        categories={categories}
        filters={filters}
        isLoading={isLoading}
        onApply={onApply}
        onClose={() => setIsPanelOpen(false)}
        onUpdateFilter={onUpdateFilter}
        open={isPanelOpen}
      />

      {hasAnyApplied ? (
        <div className="flex flex-wrap items-center gap-2">
          {appliedFilters.search ? (
            <AppliedChip
              label="Busca"
              onRemove={() => applyApplied({ search: "" })}
              value={appliedFilters.search}
            />
          ) : null}
          {appliedFilters.status ? (
            <AppliedChip
              label="Situação"
              onRemove={() => applyApplied({ status: "" })}
              value={
                STATUS_FILTER_LABELS[appliedFilters.status] ??
                labelFor(PRODUCT_STATUS_OPTIONS, appliedFilters.status)
              }
            />
          ) : null}
          {appliedFilters.category ? (
            <AppliedChip
              label="Categoria"
              onRemove={() => applyApplied({ category: "" })}
              value={labelFor(categoryOptions, appliedFilters.category)}
            />
          ) : null}
          {appliedFilters.incomplete ? (
            <AppliedChip
              label="Vitrine"
              onRemove={() => applyApplied({ incomplete: "" })}
              value="Só incompletos"
            />
          ) : null}
          {appliedFilters.stockStatus ? (
            <AppliedChip
              label="Estoque"
              onRemove={() => applyApplied({ stockStatus: "" })}
              value={labelFor(PRODUCT_STOCK_STATUS_OPTIONS, appliedFilters.stockStatus)}
            />
          ) : null}
          <button
            className={[
              "inline-flex items-center gap-1.5 border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
              FOCUS_RING,
            ].join(" ")}
            onClick={() =>
              onApply({
                category: "",
                incomplete: "",
                search: "",
                status: "",
                stockStatus: "",
              })
            }
            type="button"
          >
            <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
            Limpar filtros
          </button>
        </div>
      ) : null}
    </div>
  );
}
