import Link from "next/link";
import { X } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type {
  VendorStockFilters,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

import { buildStockHref } from "./stock-href";
import { STOCK_FILTER_LABELS, STOCK_SORT_LABELS, STOCK_TYPE_LABELS } from "./stock-labels";

type Chip = { href: string; key: string; label: string };

/**
 * Filtros ativos como fichas removíveis.
 *
 * Cada ficha remove só a si mesma, e a remoção é um link: o recorte inteiro do estoque vive na
 * URL, então desfazer um filtro é navegar, não mexer em estado de cliente. Também sobrevive a
 * recarga e pode ser compartilhado.
 */
export function StockActiveFilters({
  filters,
  taxonomies,
}: {
  filters: VendorStockFilters;
  taxonomies: VendorStockTaxonomies;
}) {
  const chips: Chip[] = [];

  if (filters.search) {
    chips.push({
      href: buildStockHref({ ...filters, search: "" }),
      key: "search",
      label: `Busca: ${filters.search}`,
    });
  }

  if (filters.filter !== "all") {
    chips.push({
      href: buildStockHref({ ...filters, filter: "all" }),
      key: "filter",
      label: STOCK_FILTER_LABELS[filters.filter],
    });
  }

  if (filters.type !== "products") {
    chips.push({
      href: buildStockHref({ ...filters, type: "products" }),
      key: "type",
      label: STOCK_TYPE_LABELS[filters.type],
    });
  }

  if (filters.category && filters.category > 0) {
    const term = taxonomies.categories.find((candidate) => candidate.id === filters.category);

    chips.push({
      href: buildStockHref({ ...filters, category: null }),
      key: "category",
      label: `Categoria: ${term?.name ?? filters.category}`,
    });
  }

  if (filters.collection) {
    const collection = taxonomies.collections.find(
      (candidate) => candidate.slug === filters.collection,
    );

    chips.push({
      href: buildStockHref({ ...filters, collection: null }),
      key: "collection",
      label: `Coleção: ${collection?.name ?? filters.collection}`,
    });
  }

  for (const tagId of filters.tags) {
    const tag = taxonomies.tags.find((candidate) => candidate.id === tagId);

    chips.push({
      href: buildStockHref({ ...filters, tags: filters.tags.filter((id) => id !== tagId) }),
      key: `tag-${tagId}`,
      label: tag?.name ?? `Tag ${tagId}`,
    });
  }

  if (filters.sort !== "name_asc") {
    chips.push({
      href: buildStockHref({ ...filters, sort: "name_asc" }),
      key: "sort",
      label: `Ordem: ${STOCK_SORT_LABELS[filters.sort]}`,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#1a1a1a] bg-white px-5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
        Filtros ativos
      </p>
      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              className={[
                "inline-flex min-h-8 items-center gap-1.5 border-2 border-[#1a1a1a] bg-brand-yellow/40 px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#1a1a1a] transition hover:bg-brand-yellow",
                FOCUS_RING,
              ].join(" ")}
              href={chip.href}
            >
              {chip.label}
              <X aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
              <span className="sr-only">Remover filtro</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        className={[
          "ml-auto inline-flex items-center gap-1.5 border-b-2 border-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
          FOCUS_RING,
        ].join(" ")}
        href={buildStockHref({
          ...filters,
          category: null,
          collection: null,
          filter: "all",
          search: "",
          sort: "name_asc",
          tags: [],
          type: "products",
        })}
      >
        <X aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
        Limpar filtros
      </Link>
    </div>
  );
}
