import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import type { ProductCollectionId, ProductTypeId } from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

/**
 * Categoria de filtro disponível.
 */
interface FilterCategory {
  id: ProductTypeId;
  label: string;
}

const SPECIFIC_CATEGORIES: SpecificType[] = [
  "sedas",
  "piteiras",
  "filtros",
  "acessorios",
];

/**
 * Lista de categorias padrão para o filtro.
 */
const DEFAULT_CATEGORIES: FilterCategory[] = [
  { id: "todos", label: "Todos" },
  { id: "sedas", label: "Sedas" },
  { id: "piteiras", label: "Piteiras" },
  { id: "filtros", label: "Filtros" },
  { id: "acessorios", label: "Acessórios" },
];

interface PriceRangeInputProps {
  label: string;
  value?: number | null;
  name: "precoMin" | "precoMax";
  placeholder: string;
}

/**
 * Input atômico para faixa de preço.
 *
 * Campo de input numérico estilizado para inserção de valores
 * mínimos ou máximos de preço.
 */
function PriceRangeInput({ label, value, name, placeholder }: PriceRangeInputProps) {
  return (
    <div className="flex-1">
      <label className="sr-only">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={typeof value === "number" ? String(value) : ""}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
      />
    </div>
  );
}

interface CategoryCheckboxProps {
  category: FilterCategory;
  checked: boolean;
  href: string;
}

function CheckboxIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-brand-dark bg-brand-dark"
          : "border-gray-300 bg-white group-hover:border-brand-dark"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none">
          <path
            d="M3.2 8.2L6.2 11.2L12.8 4.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

/**
 * Checkbox de categoria com navegação server-side.
 */
function CategoryCheckbox({ category, checked, href }: CategoryCheckboxProps) {
  return (
    <Link href={href} className="group flex items-center gap-2 cursor-pointer">
      <CheckboxIndicator checked={checked} />
      <span className="text-sm text-text-secondary group-hover:text-brand-dark transition-colors">
        {category.label}
      </span>
    </Link>
  );
}

interface ProductFilterSidebarProps {
  basePath?: string;
  collection?: ProductCollectionId;
  /** Valor mínimo do filtro de preço */
  minPrice?: number | null;
  /** Valor máximo do filtro de preço */
  maxPrice?: number | null;
  /** Lista de categorias para filtro */
  categories?: FilterCategory[];
  /** Categorias selecionadas via query params */
  selectedTypes: SpecificType[];
  viewMode: ProductsViewMode;
  perPage: number;
}

function getToggledSelection(current: SpecificType[], target: ProductTypeId) {
  if (target === "todos") {
    return [] as SpecificType[];
  }

  const currentSet = new Set(current);

  if (currentSet.has(target)) {
    currentSet.delete(target);
  } else {
    currentSet.add(target);
  }

  const ordered = SPECIFIC_CATEGORIES.filter((item) => currentSet.has(item));
  return ordered;
}

function buildHrefFromSelection(
  basePath: string,
  collection: ProductCollectionId,
  selection: SpecificType[],
  minPrice: number | null,
  maxPrice: number | null,
  viewMode: ProductsViewMode,
  perPage: number,
) {
  return buildProductsHref({
    basePath,
    collection,
    selectedTypes: selection,
    minPrice,
    maxPrice,
    viewMode,
    perPage,
  });
}

/**
 * Sidebar de filtros da página de produtos.
 *
 * Implementa filtros por categoria com navegação por query params
 * para manter o fluxo server-side.
 */
export function ProductFilterSidebar({
  basePath = "/produtos",
  collection = "todos",
  minPrice = null,
  maxPrice = null,
  categories = DEFAULT_CATEGORIES,
  selectedTypes,
  viewMode,
  perPage,
}: ProductFilterSidebarProps) {
  const isTodosChecked = selectedTypes.length === 0;

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
          <form method="GET" action={basePath} className="space-y-2">
            {collection !== "todos" ? (
              <input type="hidden" name="colecao" value={collection} />
            ) : null}
            {selectedTypes.length === 1 ? (
              <input type="hidden" name="tipo" value={selectedTypes[0]} />
            ) : null}
            {selectedTypes.length > 1 ? (
              <input type="hidden" name="tipos" value={selectedTypes.join(",")} />
            ) : null}
            {viewMode === "list" ? <input type="hidden" name="view" value="list" /> : null}
            <input type="hidden" name="perPage" value={String(perPage)} />

            <div className="flex items-center gap-2">
              <PriceRangeInput
                label="Preço mínimo"
                name="precoMin"
                value={minPrice}
                placeholder="Min"
              />
              <PriceRangeInput
                label="Preço máximo"
                name="precoMax"
                value={maxPrice}
                placeholder="Max"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-dark px-3 py-2 text-xs font-black text-white hover:opacity-90 transition-opacity"
            >
              Aplicar preço
            </button>
          </form>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100" />

        {/* Categories */}
        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
            Categorias
          </h4>
          <div className="flex flex-col gap-2.5">
            {categories.map((category) => {
              const checked =
                category.id === "todos"
                  ? isTodosChecked
                  : selectedTypes.includes(category.id as SpecificType);

              const nextSelection = getToggledSelection(selectedTypes, category.id);

              return (
                <CategoryCheckbox
                  key={category.id}
                  category={category}
                  checked={checked}
                  href={buildHrefFromSelection(
                    basePath,
                    collection,
                    nextSelection,
                    minPrice,
                    maxPrice,
                    viewMode,
                    perPage,
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100" />

        {/* Clear Filters */}
        <Link
          href={buildHrefFromSelection(
            basePath,
            collection,
            [],
            null,
            null,
            viewMode,
            perPage,
          )}
          className="text-sm text-text-muted hover:text-brand-dark transition-colors underline"
        >
          Limpar filtros
        </Link>
      </div>
    </aside>
  );
}
