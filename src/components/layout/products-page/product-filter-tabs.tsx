/**
 * Categoria disponível para filtragem de produtos.
 */
export interface FilterTab {
  id: string;
  label: string;
}

/**
 * Lista de abas de filtro padrão.
 */
export const FILTER_TABS: FilterTab[] = [
  { id: "todos", label: "TODOS" },
  { id: "sedas", label: "SEDAS" },
  { id: "piteiras", label: "PITEIRAS" },
  { id: "filtros", label: "FILTROS" },
  { id: "acessorios", label: "ACESSÓRIOS" },
];

interface ProductFilterTabsProps {
  /** Aba atualmente selecionada */
  activeTab?: string;
  /** Lista de abas disponíveis */
  tabs?: FilterTab[];
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
}: ProductFilterTabsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              isActive
                ? "bg-brand-dark text-white"
                : "bg-white text-brand-dark border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
