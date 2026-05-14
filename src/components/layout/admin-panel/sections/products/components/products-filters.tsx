"use client";

import type { FormEvent } from "react";

import { PRODUCT_STATUS_OPTIONS } from "@/constants/admin-products";
import type { AdminProductTaxonomyTerm } from "@/lib/server/admin-products";
import type { ProductFilters } from "@/types/admin-products-manager";

import { formatTermLabel } from "../helpers";
import { AdminSelectField } from "./admin-select-field";

type ProductsFiltersProps = {
  appliedFilters: ProductFilters;
  categories: AdminProductTaxonomyTerm[];
  filters: ProductFilters;
  isLoading: boolean;
  onCreateNew: () => void;
  onSubmit: () => void | Promise<void>;
  onUpdateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
};

export function ProductsFilters({
  appliedFilters,
  categories,
  filters,
  isLoading,
  onCreateNew,
  onSubmit,
  onUpdateFilter,
}: ProductsFiltersProps) {
  const hasPendingFilterChanges =
    filters.search.trim() !== appliedFilters.search.trim() ||
    filters.status.trim() !== appliedFilters.status.trim() ||
    filters.category.trim() !== appliedFilters.category.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasPendingFilterChanges || isLoading) {
      return;
    }
    void onSubmit();
  }

  const categoryOptions = [
    { label: "Todas", value: "" },
    ...categories.map((category) => ({
      label: formatTermLabel(category, categories),
      value: String(category.id),
    })),
  ];

  return (
    <form
      className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_0.8fr_1fr_auto] md:items-end"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756d5f]">
          Busca
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8f846d]">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="h-12 w-full rounded-[14px] border border-[#d6ccb6] bg-white pl-11 pr-4 text-sm font-medium text-[#231f20] outline-none transition placeholder:text-[#9a958d] focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
            onChange={(event) => onUpdateFilter("search", event.target.value)}
            placeholder="Nome, SKU ou slug"
            value={filters.search}
          />
        </span>
      </label>
      <AdminSelectField
        label="Status"
        onChange={(value) => onUpdateFilter("status", value)}
        options={PRODUCT_STATUS_OPTIONS}
        placeholder="Todos"
        variant="filter"
        value={filters.status}
      />
      <AdminSelectField
        label="Categoria"
        onChange={(value) => onUpdateFilter("category", value)}
        options={categoryOptions}
        placeholder="Todas"
        variant="filter"
        value={filters.category}
      />
      <div className="flex gap-2 md:self-end">
        <button
          className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[14px] border border-[#d4c8a5] bg-[#ffe04f] px-5 text-sm font-semibold text-[#231f20] transition hover:bg-[#f5d633] disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
          disabled={isLoading || !hasPendingFilterChanges}
          type="submit"
        >
          {isLoading ? "Filtrando" : "Filtrar"}
        </button>
        <button
          className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[14px] border border-[#231f20] bg-[#231f20] px-5 text-sm font-semibold text-[#fff6cc] transition hover:bg-[#111] md:flex-none"
          onClick={onCreateNew}
          type="button"
        >
          + Novo
        </button>
      </div>
    </form>
  );
}
