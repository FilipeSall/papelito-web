"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { ExpoPriceProduct, ExpoPricesSnapshot } from "@/features/expocannabis/types/admin-prices";
import { draftStandCents, type ExpoPricesDraft } from "@/features/expocannabis/utils/admin-prices-draft";

import { FOCUS_RING } from "../../../primitives";

import { FIELD_FOCUS_WITHIN } from "./expoday-field";
import { ExpodayPriceRow } from "./expoday-price-row";

const ALL = "todos";

type ExpodayPriceListProps = {
  snapshot: ExpoPricesSnapshot;
  draft: ExpoPricesDraft;
  invalidIds: readonly number[];
  changedIds: readonly number[];
  /** Publicação em andamento: os campos ficam travados até a resposta. */
  disabled: boolean;
  onPriceChange: (productId: number, raw: string) => void;
};

type CategoryGroup = { slug: string; name: string; products: ExpoPriceProduct[] };

function plain(text: string): string {
  return text.normalize("NFD").replaceAll(/[̀-ͯ]/g, "").toLowerCase();
}

function groupByCategory(products: readonly ExpoPriceProduct[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();

  for (const product of products) {
    const group = groups.get(product.category.slug) ?? { ...product.category, products: [] };
    group.products.push(product);
    groups.set(product.category.slug, group);
  }

  return [...groups.values()];
}

function FilterButton({ active, label, onClick }: Readonly<{ active: boolean; label: string; onClick: () => void }>) {
  return (
    <button
      aria-pressed={active}
      className={[
        "border-2 border-[#1a1a1a] px-3 py-2 text-[10.5px] font-black uppercase tracking-[0.14em] transition",
        active ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white hover:bg-brand-yellow",
        FOCUS_RING,
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type GroupProps = Omit<ExpodayPriceListProps, "snapshot"> & { group: CategoryGroup; kitIds: readonly number[] };

function CategoryBlock({ changedIds, disabled, draft, group, invalidIds, kitIds, onPriceChange }: Readonly<GroupProps>) {
  return (
    <section aria-label={group.name}>
      <header className="flex justify-between border-b-2 border-[#1a1a1a] bg-[#f7f2e7] px-5 py-2 text-[10.5px] font-black uppercase tracking-[0.2em]">
        <span>{group.name}</span>
        <span>{group.products.length === 1 ? "1 produto" : `${group.products.length} produtos`}</span>
      </header>
      <ul>
        {group.products.map((product) => (
          <ExpodayPriceRow
            changed={changedIds.includes(product.id)}
            disabled={disabled}
            inKit={kitIds.includes(product.id)}
            invalid={invalidIds.includes(product.id)}
            key={product.id}
            onChange={onPriceChange}
            product={product}
            raw={draft.prices[product.id] ?? ""}
            standCents={draftStandCents(product, draft)}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * Lista de preços do estande agrupada por categoria, com busca (sem acento e sem caixa) e filtro
 * por categoria. Filtro e busca só mudam o que aparece; o rascunho continua inteiro.
 */
export function ExpodayPriceList({ changedIds, disabled, draft, invalidIds, onPriceChange, snapshot }: Readonly<ExpodayPriceListProps>) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const allGroups = useMemo(() => groupByCategory(snapshot.products), [snapshot.products]);

  const groups = useMemo(() => {
    const needle = plain(query.trim());
    const visible = snapshot.products.filter(
      (product) => (category === ALL || product.category.slug === category) && plain(product.name).includes(needle),
    );
    return groupByCategory(visible);
  }, [category, query, snapshot.products]);

  return (
    <div className="border-2 border-[#1a1a1a] bg-[#fbf7ef] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#1a1a1a] px-4 py-3">
        <label className={`flex h-10 min-w-0 flex-1 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 sm:max-w-xs ${FIELD_FOCUS_WITHIN}`}>
          <Search aria-hidden className="size-4 shrink-0" strokeWidth={2.2} />
          <span className="sr-only">Buscar produto</span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar produto"
            type="search"
            value={query}
          />
        </label>
        <FilterButton active={category === ALL} label="Todos" onClick={() => setCategory(ALL)} />
        {allGroups.map((group) => (
          <FilterButton active={category === group.slug} key={group.slug} label={group.name} onClick={() => setCategory(group.slug)} />
        ))}
      </div>
      {groups.length === 0 ? (
        <div className="m-4 border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-6 py-10 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em]">Nada encontrado</p>
          <p className="mt-2 text-sm text-[#231f20]/64">Nenhum produto com esse nome. Tente outro termo ou volte para Todos.</p>
        </div>
      ) : (
        groups.map((group) => (
          <CategoryBlock
            changedIds={changedIds}
            disabled={disabled}
            draft={draft}
            group={group}
            invalidIds={invalidIds}
            key={group.slug}
            kitIds={snapshot.kit.productIds}
            onPriceChange={onPriceChange}
          />
        ))
      )}
    </div>
  );
}
