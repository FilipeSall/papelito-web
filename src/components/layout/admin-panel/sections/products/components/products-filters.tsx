"use client";

import type { FormEvent } from "react";

import { PRODUCT_STATUS_OPTIONS } from "@/constants/admin-products";
import type { AdminProductTaxonomyTerm } from "@/lib/server/admin-products";
import type { ProductFilters } from "@/types/admin-products-manager";

import { formatTermLabel } from "../helpers";
import { AdminSelectField } from "./admin-select-field";

type ProductsFiltersProps = {
  categories: AdminProductTaxonomyTerm[];
  filters: ProductFilters;
  isLoading: boolean;
  onCreateNew: () => void;
  onSubmit: () => void | Promise<void>;
  onUpdateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
};

export function ProductsFilters({
  categories,
  filters,
  isLoading,
  onCreateNew,
  onSubmit,
  onUpdateFilter,
}: ProductsFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      className="grid gap-3 border-b border-[#d8d0bd] px-4 py-4 md:grid-cols-[1.35fr_0.72fr_0.86fr_auto] md:items-end"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d8678]">
          Busca
        </span>
        <input
          className="h-11 rounded-[12px] border border-[#cfc9bd] bg-white px-4 text-sm font-medium text-[#231f20] outline-none transition placeholder:text-[#9a958d] focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
          onChange={(event) => onUpdateFilter("search", event.target.value)}
          placeholder="Nome, SKU ou slug"
          value={filters.search}
        />
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
          className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#ffe500] px-5 text-xs font-black uppercase tracking-[0.2em] text-[#231f20] transition hover:bg-[#efd800] disabled:opacity-60 md:flex-none"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Filtrando" : "Filtrar"}
        </button>
        <button
          className="inline-flex h-11 flex-1 items-center justify-center rounded-[12px] border-2 border-[#231f20] bg-[#231f20] px-5 text-xs font-black uppercase tracking-[0.2em] text-[#ffe500] transition hover:bg-[#111] md:flex-none"
          onClick={onCreateNew}
          type="button"
        >
          Novo
        </button>
      </div>
    </form>
  );
}
