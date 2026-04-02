import Link from "next/link";
import type { ProductTypeId, ProductsCatalogTab } from "@/features/catalog";

/**
 * Categoria disponível para filtragem de produtos.
 */
export interface FilterTab {
  id: ProductTypeId;
  label: string;
  count?: number;
}

/**
 * Lista de abas de filtro padrão.
 */
export const FILTER_TABS: FilterTab[] = [
  { id: "todos", label: "TODOS", count: 0 },
  { id: "sedas", label: "SEDAS", count: 0 },
  { id: "piteiras", label: "PITEIRAS", count: 0 },
  { id: "filtros", label: "FILTROS", count: 0 },
  { id: "acessorios", label: "ACESSÓRIOS", count: 0 },
];

interface ProductFilterTabsProps {
  /** Aba atualmente selecionada */
  activeTab?: ProductTypeId;
  /** Lista de abas disponíveis */
  tabs?: ProductsCatalogTab[] | FilterTab[];
  /** Faixa de preço ativa */
  minPrice?: number | null;
  maxPrice?: number | null;
}

/**
 * Barra de abas para filtragem de produtos por categoria.
 *
 * Exibe pills horizontais com as categorias principais de produtos.
 * A aba ativa é destacada com fundo preto e texto branco.
 * Por enquanto, os filtros são apenas visuais (estáticos).
 *
 * @example
 * ```tsx
 * <ProductFilterTabs activeTab="todos" />
 * ```
 */
export function ProductFilterTabs({
  activeTab = "todos",
  tabs = FILTER_TABS,
  minPrice = null,
  maxPrice = null,
}: ProductFilterTabsProps) {
  const typedTabs = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    count: tab.count,
  }));

  const createHref = (tabId: ProductTypeId) => {
    const params = new URLSearchParams();

    if (tabId !== "todos") {
      params.set("tipo", tabId);
    }
    if (typeof minPrice === "number") {
      params.set("precoMin", String(minPrice));
    }
    if (typeof maxPrice === "number") {
      params.set("precoMax", String(maxPrice));
    }

    const query = params.toString();
    return query ? `/produtos?${query}` : "/produtos";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {typedTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={createHref(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-black transition-colors border ${
              isActive
                ? "bg-brand-dark text-white border-brand-dark"
                : "bg-white text-brand-dark border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
