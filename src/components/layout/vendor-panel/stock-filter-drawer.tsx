"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import { BaseModal } from "@/components/ui/base-modal";
import type {
  VendorStockFilter,
  VendorStockFilters,
  VendorStockSort,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";

const statusOptions: Array<[VendorStockFilter, string]> = [
  ["all", "Todos"],
  ["with_stock", "Com estoque"],
  ["zeroed_only", "Zerados"],
];

const sortOptions: Array<{ label: string; value: VendorStockSort }> = [
  { label: "Nome (A-Z)", value: "name_asc" },
  { label: "Nome (Z-A)", value: "name_desc" },
  { label: "Maior estoque", value: "qty_desc" },
  { label: "Menor estoque", value: "qty_asc" },
  { label: "Ajuste mais recente", value: "updated_desc" },
];

const DEFAULTS: VendorStockFilters = {
  category: null,
  filter: "all",
  search: "",
  sort: "name_asc",
  tags: [],
};

const selectTriggerClassName =
  "min-h-11 rounded-none border-2 border-[#1a1a1a] bg-white text-[#1a1a1a]";
const selectLabelClassName =
  "text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/72";

export function StockFilterDrawer({
  filters,
  onClose,
  open,
  taxonomies,
}: {
  filters: VendorStockFilters;
  onClose: () => void;
  open: boolean;
  taxonomies: VendorStockTaxonomies;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<VendorStockFilters>(filters);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setDraft(filters);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const categoryOptions = [
    { label: "Todas", value: "" },
    ...taxonomies.categories.map((term) => ({
      label: `${term.name} (${term.count})`,
      value: String(term.id),
    })),
  ];

  function toggleTag(id: number) {
    setDraft((current) => ({
      ...current,
      tags: current.tags.includes(id)
        ? current.tags.filter((tag) => tag !== id)
        : [...current.tags, id],
    }));
  }

  function apply() {
    onClose();
    router.push(buildStockHref({ ...draft, search: filters.search }));
  }

  function clear() {
    onClose();
    router.push(buildStockHref({ ...DEFAULTS, search: filters.search }));
  }

  return (
    <BaseModal
      ariaLabelledBy="stock-filter-title"
      contentClassName="ml-auto h-full max-w-sm"
      onClose={onClose}
      open={open}
    >
      <div className="flex h-full max-h-full flex-col border-l-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[-8px_0px_0px_#1a1a1a]">
        <div className="flex items-center justify-between border-b-2 border-[#1a1a1a] bg-brand-yellow/30 px-5 py-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-[#1a1a1a]" id="stock-filter-title">
            Filtrar produtos
          </h2>
          <button
            aria-label="Fechar filtros"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <CheckoutCustomSelect
            label="Ordenar por"
            labelClassName={selectLabelClassName}
            options={sortOptions}
            placeholder="Ordenar por"
            triggerClassName={selectTriggerClassName}
            value={draft.sort}
            onChange={(value) => setDraft((c) => ({ ...c, sort: value as VendorStockSort }))}
          />

          {taxonomies.categories.length > 0 ? (
            <CheckoutCustomSelect
              label="Categoria"
              labelClassName={selectLabelClassName}
              options={categoryOptions}
              placeholder="Todas"
              triggerClassName={selectTriggerClassName}
              value={draft.category ? String(draft.category) : ""}
              onChange={(value) => setDraft((c) => ({ ...c, category: value ? Number(value) : null }))}
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/72">
              Disponibilidade em estoque
            </p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(([value, label]) => (
                <button
                  className={`inline-flex min-h-9 cursor-pointer items-center border-2 border-[#1a1a1a] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 ${
                    draft.filter === value
                      ? "bg-[#1a1a1a] text-brand-yellow"
                      : "bg-white text-[#1a1a1a] hover:bg-brand-yellow"
                  }`}
                  key={value}
                  onClick={() => setDraft((c) => ({ ...c, filter: value }))}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {taxonomies.tags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/72">Tags</p>
              <div className="flex flex-wrap gap-2">
                {taxonomies.tags.map((term) => (
                  <button
                    className={`inline-flex min-h-9 cursor-pointer items-center border-2 border-[#1a1a1a] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 ${
                      draft.tags.includes(term.id)
                        ? "bg-[#1a1a1a] text-brand-yellow"
                        : "bg-white text-[#1a1a1a] hover:bg-brand-yellow"
                    }`}
                    key={term.id}
                    onClick={() => toggleTag(term.id)}
                    type="button"
                  >
                    {term.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-[#1a1a1a] bg-white px-5 py-4">
          <button
            className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            onClick={clear}
            type="button"
          >
            Limpar filtros
          </button>
          <button
            className="inline-flex h-11 cursor-pointer items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            onClick={apply}
            type="button"
          >
            Filtrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
