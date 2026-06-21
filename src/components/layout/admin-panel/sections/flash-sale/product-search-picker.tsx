import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, Plus, Search } from "lucide-react";

import type {
  AdminProduct,
  AdminProductTaxonomyTerm,
} from "@/lib/server/admin-products";
import { formatBRL } from "@/lib/format-currency";

import { AdminSelectField } from "../products/components/admin-select-field";
import { formatTermLabel } from "../products/helpers";
import { toMoney } from "./utils";

export type ProductPickerFilters = {
  category: string;
  search: string;
};

type ProductSearchPickerProps = {
  candidates: AdminProduct[];
  categories: AdminProductTaxonomyTerm[];
  currentPage: number;
  filters: ProductPickerFilters;
  isSearching: boolean;
  onAdd: (product: AdminProduct) => void;
  onApply: () => void;
  onFiltersChange: (patch: Partial<ProductPickerFilters>) => void;
  onPageChange: (page: number) => void;
  selectedIds: Set<number>;
  totalPages: number;
  totalProducts: number;
};

export function ProductSearchPicker({
  candidates,
  categories,
  currentPage,
  filters,
  isSearching,
  onAdd,
  onApply,
  onFiltersChange,
  onPageChange,
  selectedIds,
  totalPages,
  totalProducts,
}: ProductSearchPickerProps) {
  const safeCurrentPage = Math.max(1, currentPage);
  const safeTotalPages = Math.max(1, totalPages);
  const categoryOptions = [
    { label: "Todas", value: "" },
    ...categories.map((category) => ({
      label: formatTermLabel(category, categories),
      value: String(category.id),
    })),
  ];

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="h-2 w-full bg-brand-yellow" />
      <div className="p-4">
        <header className="mb-4 flex items-center justify-between gap-2 border-b-2 border-[#1a1a1a] pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#1a1a1a]" strokeWidth={2} />
            <h2 className="text-[15px] font-black uppercase tracking-[0.05em] text-[#1a1a1a]">
              Adicionar Produtos
            </h2>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1a1a1a]/50">
            {totalProducts} {totalProducts === 1 ? "produto" : "produtos"}
          </span>
        </header>

        <div className="space-y-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1a1a1a]/40"
              strokeWidth={2}
            />
            <input
              aria-label="Buscar produtos por nome ou SKU"
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white pl-10 pr-4 text-sm leading-5 text-[#1a1a1a] outline-none transition focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSearching}
              onChange={(event) => onFiltersChange({ search: event.target.value })}
              placeholder={isSearching ? "Buscando..." : "Buscar por nome ou SKU..."}
              type="search"
              value={filters.search}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <AdminSelectField
                label="Categoria"
                onChange={(value) => onFiltersChange({ category: value })}
                options={categoryOptions}
                placeholder="Todas"
                value={filters.category}
                variant="filter"
              />
            </div>
            <button
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.1em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSearching}
              onClick={onApply}
              type="button"
            >
              {isSearching ? "Filtrando..." : "Aplicar Filtros"}
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden border-2 border-[#1a1a1a] bg-white">
          {candidates.length === 0 ? (
            <p className="px-4 py-5 text-sm leading-5 text-text-secondary">
              Nenhum produto publicado encontrado para o filtro atual.
            </p>
          ) : (
            <ul className="max-h-105 overflow-y-auto">
              {candidates.map((product) => {
                const image = product.images[0]?.src ?? "";
                const basePrice = toMoney(product.regularPrice) || toMoney(product.price);
                const isSelected = selectedIds.has(product.id);
                const hasImage = image.length > 0;

                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between border-b border-[#1a1a1a]/10 p-2 transition-colors last:border-b-0 hover:bg-[#faf8f2]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-[#1a1a1a]/20 bg-[#faf8f2]">
                        {hasImage ? (
                          <Image
                            alt={product.name}
                            className="h-full w-full object-cover"
                            height={40}
                            src={image}
                            width={40}
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-[#1a1a1a]/30" strokeWidth={1.75} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold leading-4 text-[#1a1a1a]">
                          {product.name}
                        </p>
                        <p className="truncate text-[12px] leading-4.5 text-text-secondary">
                          SKU: {product.sku || "—"}
                          {basePrice > 0 ? ` • ${formatBRL(basePrice)}` : ""}
                          {product.categories[0]?.name ? ` • ${product.categories[0].name}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      aria-label={`Adicionar ${product.name}`}
                      className="ml-2 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-dashed border-[#1a1a1a] text-[#1a1a1a] transition-colors hover:border-solid hover:bg-[#1a1a1a] hover:text-brand-yellow disabled:cursor-not-allowed disabled:border-[#1a1a1a]/20 disabled:text-[#1a1a1a]/20"
                      disabled={isSelected}
                      onClick={() => onAdd(product)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 ? (
          <nav
            aria-label="Paginação de produtos"
            className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#1a1a1a]"
          >
            <span>
              Página {safeCurrentPage} de {safeTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                aria-label="Página anterior"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isSearching || safeCurrentPage <= 1}
                onClick={() => onPageChange(safeCurrentPage - 1)}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                aria-label="Próxima página"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-brand-yellow disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isSearching || safeCurrentPage >= safeTotalPages}
                onClick={() => onPageChange(safeCurrentPage + 1)}
                type="button"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
