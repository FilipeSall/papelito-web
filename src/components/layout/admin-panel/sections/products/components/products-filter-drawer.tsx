"use client";

import { X } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import {
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_STOCK_STATUS_OPTIONS,
} from "@/constants/admin-products";
import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type { ProductFilters } from "@/types/admin-products-manager";

import { FOCUS_RING } from "../../../primitives";

import { AdminSelectField } from "./admin-select-field";

const STATUS_FILTER_LABELS: Record<string, string> = {
  "": "Todos",
  draft: "Rascunhos",
  pending: "Pendentes",
  private: "Privados",
  publish: "Publicados",
};

const EMPTY_FILTERS: ProductFilters = {
  category: "",
  incomplete: "",
  search: "",
  status: "",
  stockStatus: "",
};

function pillClassName(isActive: boolean) {
  return [
    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 border-2 border-[#1a1a1a] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] transition",
    FOCUS_RING,
    isActive ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
  ].join(" ");
}

function DrawerSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/72">
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * Filtros do catálogo em gaveta lateral, no mesmo desenho da gaveta de estoque do vendor — mesma
 * borda, mesma sombra invertida e o mesmo par Limpar/Filtrar no rodapé.
 *
 * Kits não aparecem aqui: eles têm segmento próprio na navegação, e repetir a separação dentro da
 * gaveta daria dois caminhos para a mesma troca de lista.
 */
export function ProductsFilterDrawer({
  appliedFilters,
  categories,
  filters,
  isLoading,
  onApply,
  onClose,
  onUpdateFilter,
  open,
}: {
  appliedFilters: ProductFilters;
  categories: AdminCategory[];
  filters: ProductFilters;
  isLoading: boolean;
  onApply: (filters: ProductFilters) => void;
  onClose: () => void;
  onUpdateFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  open: boolean;
}) {
  const categoryOptions = [
    { label: "Todas as categorias", value: "" },
    ...categories
      .filter((category) => category.isActive && !category.archivedAt)
      .map((category) => ({ label: category.name, value: String(category.id) })),
  ];

  return (
    <BaseModal
      ariaLabelledBy="products-filter-title"
      contentClassName="ml-auto h-full max-w-sm"
      onClose={onClose}
      open={open}
    >
      <div className="flex h-full max-h-full flex-col border-l-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[-8px_0px_0px_#1a1a1a]">
        <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] bg-brand-yellow/30 px-5 py-4">
          <h2
            className="text-lg font-black uppercase tracking-widest text-[#1a1a1a]"
            id="products-filter-title"
          >
            Filtrar catálogo
          </h2>
          <button
            aria-label="Fechar filtros"
            className={[
              "inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition hover:bg-brand-yellow",
              FOCUS_RING,
            ].join(" ")}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={2.6} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <DrawerSection title="Situação">
            <div className="flex flex-wrap gap-2">
              {PRODUCT_STATUS_OPTIONS.map((option) => (
                <button
                  aria-pressed={filters.status === option.value}
                  className={pillClassName(filters.status === option.value)}
                  key={option.value || "all"}
                  onClick={() => onUpdateFilter("status", option.value)}
                  type="button"
                >
                  {STATUS_FILTER_LABELS[option.value] ?? option.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          <AdminSelectField
            anchoredMenu
            label="Categoria"
            onChange={(value) => onUpdateFilter("category", value)}
            options={categoryOptions}
            placeholder="Todas as categorias"
            value={filters.category}
            variant="vendor-create"
          />

          <AdminSelectField
            anchoredMenu
            label="Estoque"
            onChange={(value) => onUpdateFilter("stockStatus", value)}
            options={PRODUCT_STOCK_STATUS_OPTIONS}
            placeholder="Qualquer estoque"
            value={filters.stockStatus}
            variant="vendor-create"
          />

          <DrawerSection title="Prontidão para a vitrine">
            <label className="flex cursor-pointer items-start gap-3 border-2 border-[#1a1a1a] bg-white p-3">
              <input
                checked={filters.incomplete === "1"}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1a1a]"
                onChange={(event) =>
                  onUpdateFilter("incomplete", event.target.checked ? "1" : "")
                }
                type="checkbox"
              />
              <span>
                <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                  Só produtos incompletos
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#231f20]/68">
                  Sem peso, sem alguma dimensão, sem imagem, sem preço ou sem categoria — falta o
                  necessário para chegar à vitrine.
                </span>
              </span>
            </label>
          </DrawerSection>
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
          <button
            className={[
              "inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
              FOCUS_RING,
            ].join(" ")}
            disabled={isLoading}
            onClick={() => {
              onClose();
              onApply({ ...EMPTY_FILTERS, search: appliedFilters.search });
            }}
            type="button"
          >
            Limpar filtros
          </button>
          <button
            className={[
              "inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
              FOCUS_RING,
            ].join(" ")}
            disabled={isLoading}
            onClick={() => {
              onClose();
              onApply({ ...filters });
            }}
            type="button"
          >
            Filtrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
