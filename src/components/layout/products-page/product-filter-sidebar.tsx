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
  variant: "default" | "collection";
}

/**
 * Input atômico para faixa de preço.
 *
 * Campo de input numérico estilizado para inserção de valores
 * mínimos ou máximos de preço.
 */
function PriceRangeInput({ label, value, invalid, name, placeholder, variant }: PriceRangeInputProps) {
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
        className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow ${
          variant === "collection"
            ? "border-2 border-[#1a1a1a] rounded-none focus:border-[#1a1a1a]"
            : "border border-gray-200 rounded-lg focus:border-transparent"
        }`}
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
  variant?: "default" | "collection";
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
  variant = "default",
}: ProductFilterSidebarProps) {
  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className={`bg-white p-4 ${variant === "collection" ? "border-2 border-[#1a1a1a] rounded-none" : "rounded-xl border border-gray-100"}`}>
        {/* Header */}
        <h3 className={`text-sm text-brand-dark uppercase tracking-wide ${variant === "collection" ? "font-black tracking-[0.12em]" : "font-bold"}`}>
          Filtros
        </h3>

        {/* Price Range */}
        <div className="mt-4">
          <h4 className={`text-xs text-text-muted uppercase tracking-wide mb-2 ${variant === "collection" ? "font-black" : "font-medium"}`}>
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
                variant={variant}
              />
              <PriceRangeInput
                label="Preço máximo"
                name="precoMax"
                value={priceError ? rawMaxPrice : maxPrice}
                invalid={Boolean(priceError)}
                placeholder="Max"
                variant={variant}
              />
            </div>
            {priceError ? (
              <p className="text-xs font-medium text-red-700" id={PRICE_ERROR_ID} role="alert">
                {priceError}
              </p>
            ) : null}
            <button
              type="submit"
              className={`w-full bg-brand-dark px-3 py-2 text-xs font-black text-white transition-opacity hover:opacity-90 ${variant === "collection" ? "border-2 border-[#1a1a1a] rounded-none uppercase tracking-[0.08em] shadow-[3px_3px_0px_#ffe500]" : "rounded-lg"}`}
            >
              Aplicar preço
            </button>
          </form>
        </div>

        {/* Divider */}
        <hr className={`my-4 ${variant === "collection" ? "border-[#1a1a1a]" : "border-gray-100"}`} />

        {/* Categories */}
        <div>
          <h4 className={`text-xs text-text-muted uppercase tracking-wide mb-3 ${variant === "collection" ? "font-black" : "font-medium"}`}>
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
            variant={variant}
            viewMode={viewMode}
          />
        </div>

        {/* Divider */}
        <hr className={`my-4 ${variant === "collection" ? "border-[#1a1a1a]" : "border-gray-100"}`} />

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
          className={`text-sm text-text-muted hover:text-brand-dark transition-colors underline ${variant === "collection" ? "font-black uppercase tracking-[0.06em]" : ""}`}
        >
          Limpar filtros
        </Link>
      </div>
    </aside>
  );
}
