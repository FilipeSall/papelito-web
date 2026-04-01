/**
 * Categoria de filtro disponível.
 */
interface FilterCategory {
  id: string;
  label: string;
  checked: boolean;
}

/**
 * Lista de categorias padrão para o filtro.
 */
const DEFAULT_CATEGORIES: FilterCategory[] = [
  { id: "todos", label: "Todos", checked: true },
  { id: "sedas", label: "Sedas", checked: false },
  { id: "piteiras", label: "Piteiras", checked: false },
  { id: "acessorios", label: "Acessórios", checked: false },
];

interface PriceRangeInputProps {
  label: string;
  value: string;
  placeholder: string;
}

/**
 * Input atômico para faixa de preço.
 *
 * Campo de input numérico estilizado para inserção de valores
 * mínimos ou máximos de preço.
 */
function PriceRangeInput({ label, value, placeholder }: PriceRangeInputProps) {
  return (
    <div className="flex-1">
      <label className="sr-only">{label}</label>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
      />
    </div>
  );
}

interface CategoryCheckboxProps {
  category: FilterCategory;
}

/**
 * Checkbox atômico de categoria.
 *
 * Item de checkbox estilizado para seleção de categorias
 * no filtro lateral.
 */
function CategoryCheckbox({ category }: CategoryCheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        defaultChecked={category.checked}
        className="w-4 h-4 rounded border-gray-300 text-brand-dark focus:ring-brand-yellow cursor-pointer"
      />
      <span className="text-sm text-text-secondary group-hover:text-brand-dark transition-colors">
        {category.label}
      </span>
    </label>
  );
}

interface ProductFilterSidebarProps {
  /** Valor mínimo do filtro de preço */
  minPrice?: string;
  /** Valor máximo do filtro de preço */
  maxPrice?: string;
  /** Lista de categorias para filtro */
  categories?: FilterCategory[];
}

/**
 * Sidebar de filtros da página de produtos.
 *
 * Componente molecular que agrupa os filtros disponíveis:
 * - Faixa de preço com inputs min/max
 * - Lista de categorias com checkboxes
 * - Link para limpar todos os filtros
 *
 * Por enquanto, os filtros são apenas visuais (estáticos).
 *
 * @example
 * ```tsx
 * <ProductFilterSidebar minPrice="0" maxPrice="30" />
 * ```
 */
export function ProductFilterSidebar({
  minPrice = "0",
  maxPrice = "30",
  categories = DEFAULT_CATEGORIES,
}: ProductFilterSidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {/* Header */}
        <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wide">
          Filtros
        </h3>

        {/* Price Range */}
        <div className="mt-4">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            Faixa de Preço
          </h4>
          <div className="flex items-center gap-2">
            <PriceRangeInput label="Preço mínimo" value={minPrice} placeholder="Min" />
            <PriceRangeInput label="Preço máximo" value={maxPrice} placeholder="Max" />
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100" />

        {/* Categories */}
        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
            Categorias
          </h4>
          <div className="flex flex-col gap-2.5">
            {categories.map((category) => (
              <CategoryCheckbox key={category.id} category={category} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100" />

        {/* Clear Filters */}
        <button
          type="button"
          className="text-sm text-text-muted hover:text-brand-dark transition-colors underline"
        >
          Limpar filtros
        </button>
      </div>
    </aside>
  );
}
