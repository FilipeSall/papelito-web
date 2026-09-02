import Link from "next/link";
import { buildProductsHref } from "./products-query-helpers";
import { CategoryFilterTree, type CategoryFilterOption } from "./category-filter-tree";
import type {
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogCategory,
} from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

type SpecificType = Exclude<ProductTypeId, "todos">;

/**
 * Categoria de filtro disponível.
 */
type FilterCategory = CategoryFilterOption;

/**
 * Lista de categorias padrão para o filtro.
 */
const DEFAULT_CATEGORIES: FilterCategory[] = [
  { id: "todos", label: "Todos" },
];

const PRICE_ERROR_ID = "filtro-preco-erro";

interface PriceRangeInputProps {
  label: string;
  value?: string | number | null;
  invalid?: boolean;
  name: "precoMin" | "precoMax";
  placeholder: string;
}

/**
 * Input atômico para faixa de preço.
 *
 * Campo de input numérico estilizado para inserção de valores
 * mínimos ou máximos de preço.
 */
function PriceRangeInput({ label, value, invalid, name, placeholder }: PriceRangeInputProps) {
  return (
    <div className="flex-1">
      <label className="sr-only">{label}</label>
      <input
        name={name}
        type="text"
        defaultValue={typeof value === "number" ? String(value) : value ?? ""}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? PRICE_ERROR_ID : undefined}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-yellow"
      />
    </div>
  );
}

interface ProductFilterSidebarProps {
  basePath?: string;
  collection?: ProductCollectionId;
  /** Valor mínimo do filtro de preço */
  minPrice?: number | null;
  /** Valor máximo do filtro de preço */
  maxPrice?: number | null;
  priceError?: string;
  /** Valores crus da URL, exibidos quando `priceError` impede de derivar números. */
  rawMinPrice?: string | null;
  rawMaxPrice?: string | null;
  /** Lista de categorias para filtro */
  categories?: FilterCategory[];
  /** Árvore de subcategorias por categoria, vinda da taxonomia Papelito. */
  categoryTree?: ProductsCatalogCategory[];
  /** Categorias selecionadas via query params */
  selectedTypes: SpecificType[];
  /** Subcategorias selecionadas via `?subcategoria=` */
  selectedSubcategories?: string[];
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
}

function buildHrefFromSelection(
  basePath: string,
  collection: ProductCollectionId,
  selection: SpecificType[],
  minPrice: number | null,
  maxPrice: number | null,
  viewMode: ProductsViewMode,
  perPage: number,
  search?: string,
) {
  return buildProductsHref({
    basePath,
    collection,
    selectedTypes: selection,
    minPrice,
    maxPrice,
    viewMode,
    perPage,
    search,
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
  priceError,
  rawMinPrice,
  rawMaxPrice,
  categories = DEFAULT_CATEGORIES,
  categoryTree = [],
  selectedTypes,
  selectedSubcategories = [],
  viewMode,
  perPage,
  search,
}: ProductFilterSidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        {/* Header */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-dark">
          Filtros
        </h3>

        {/* Price Range */}
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
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
            {selectedSubcategories.length > 0 ? (
              <input type="hidden" name="subcategoria" value={selectedSubcategories.join(",")} />
            ) : null}
            {viewMode === "list" ? <input type="hidden" name="view" value="list" /> : null}
            <input type="hidden" name="perPage" value={String(perPage)} />
            {search ? <input type="hidden" name="busca" value={search} /> : null}

            <div className="flex items-center gap-2">
              <PriceRangeInput
                label="Preço mínimo"
                name="precoMin"
                value={priceError ? rawMinPrice : minPrice}
                invalid={Boolean(priceError)}
                placeholder="Min"
              />
              <PriceRangeInput
                label="Preço máximo"
                name="precoMax"
                value={priceError ? rawMaxPrice : maxPrice}
                invalid={Boolean(priceError)}
                placeholder="Max"
              />
            </div>
            {priceError ? (
              <p className="text-xs font-medium text-red-700" id={PRICE_ERROR_ID} role="alert">
                {priceError}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-dark px-3 py-2 text-xs font-black text-white transition-opacity hover:opacity-90"
            >
              Aplicar preço
            </button>
          </form>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-100" />

        {/* Categories */}
        <div>
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Categorias
          </h4>
          <CategoryFilterTree
            basePath={basePath}
            categoryTree={categoryTree}
            collection={collection}
            maxPrice={maxPrice}
            minPrice={minPrice}
            options={categories}
            perPage={perPage}
            search={search}
            selectedSubcategories={selectedSubcategories}
            selectedTypes={selectedTypes}
            viewMode={viewMode}
          />
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
            search,
          )}
          className="text-sm text-text-muted underline transition-colors hover:text-brand-dark"
        >
          Limpar filtros
        </Link>
      </div>
    </aside>
  );
}
