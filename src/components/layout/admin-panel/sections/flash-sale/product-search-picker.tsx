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
    <section className="rounded-2xl border border-[#cec7aa] bg-white p-4">
      <header className="mb-4 flex items-center justify-between gap-2 border-b border-[#cec7aa] pb-2">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[#6a5f00]" strokeWidth={2} />
          <h2 className="text-[18px] font-semibold leading-6 text-[#1e1c10]">
            Adicionar Produtos
          </h2>
        </div>
        <span className="text-[12px] font-medium leading-4 text-[#4b4731]">
          {totalProducts} {totalProducts === 1 ? "produto" : "produtos"} publicados
        </span>
      </header>

      <div className="space-y-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4b4731]"
            strokeWidth={2}
          />
          <input
            aria-label="Buscar produtos por nome ou SKU"
            className="h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] pl-11 pr-4 text-sm leading-5 text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00] disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[14px] border border-[#1e1c10] bg-[#1e1c10] px-5 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#fee400] transition-colors hover:bg-[#1e1c10]/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSearching}
            onClick={onApply}
            type="button"
          >
            {isSearching ? "Filtrando..." : "Aplicar filtros"}
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[#cec7aa] bg-[#fff9ea]">
        {candidates.length === 0 ? (
          <p className="px-4 py-5 text-sm leading-5 text-[#4b4731]">
            Nenhum produto publicado encontrado para o filtro atual.
          </p>
        ) : (
          <ul className="max-h-[420px] overflow-y-auto">
            {candidates.map((product) => {
              const image = product.images[0]?.src ?? "";
              const basePrice = toMoney(product.regularPrice) || toMoney(product.price);
              const isSelected = selectedIds.has(product.id);
              const hasImage = image.length > 0;

              return (
                <li
                  key={product.id}
                  className="flex items-center justify-between border-b border-[#cec7aa] p-2 transition-colors last:border-b-0 hover:bg-[#eee8d4]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#cec7aa] bg-[#e9e2cf]">
                      {hasImage ? (
                        <Image
                          alt={product.name}
                          className="h-full w-full object-cover"
                          height={40}
                          src={image}
                          width={40}
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-[#a06b00]" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold leading-4 tracking-[0.02em] text-[#1e1c10]">
                        {product.name}
                      </p>
                      <p className="truncate text-[13px] leading-[18px] text-[#4b4731]">
                        SKU: {product.sku || "—"}
                        {basePrice > 0 ? ` • ${formatBRL(basePrice)}` : ""}
                        {product.categories[0]?.name ? ` • ${product.categories[0].name}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label={`Adicionar ${product.name}`}
                    className="ml-2 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[#6a5f00] transition-colors hover:bg-[#6a5f00]/10 disabled:cursor-not-allowed disabled:text-[#cec7aa]"
                    disabled={isSelected}
                    onClick={() => onAdd(product)}
                    type="button"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2} />
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
          className="mt-3 flex items-center justify-between gap-2 text-[12px] font-medium leading-4 text-[#4b4731]"
        >
          <span>
            Página {safeCurrentPage} de {safeTotalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Página anterior"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#cec7aa] bg-white text-[#1e1c10] transition-colors hover:bg-[#eee8d4] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isSearching || safeCurrentPage <= 1}
              onClick={() => onPageChange(safeCurrentPage - 1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              aria-label="Próxima página"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#cec7aa] bg-white text-[#1e1c10] transition-colors hover:bg-[#eee8d4] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isSearching || safeCurrentPage >= safeTotalPages}
              onClick={() => onPageChange(safeCurrentPage + 1)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
