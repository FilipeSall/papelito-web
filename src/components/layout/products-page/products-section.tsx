import { ProductFilterTabs } from "./product-filter-tabs";
import { ProductFilterSidebar } from "./product-filter-sidebar";
import { ProductCollectionFilters } from "./product-collection-filters";
import { ProductsGrid } from "./products-grid";
import { ProductsPagination } from "./products-pagination";
import { ProductsPerPageSelector } from "./products-per-page-selector";
import { ViewToggle } from "./view-toggle";
import { AddToCartToastHost } from "./add-to-cart-toast-host";
import { CoverageWarningToastHost } from "./coverage-warning-toast-host";
import { ClearProductSearchButton, ProductSearch } from "./product-search";
import { CatalogUnavailableNotice } from "./catalog-unavailable-notice";
import { ProductAvailabilityProvider } from "@/features/catalog/hooks/use-product-availability";
import type {
  CatalogCoverageStatus,
  CatalogSourceStatus,
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogTab,
} from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductsSectionProps {
  basePath?: string;
  activeCollection?: ProductCollectionId;
  showCollectionFilters?: boolean;
  products: ProductsCatalogItem[];
  tabs: ProductsCatalogTab[];
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  minPrice: number | null;
  maxPrice: number | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  activeType: ProductTypeId;
  viewMode: ProductsViewMode;
  perPage: number;
  coverageCep?: string | null;
  coverageStatus?: CatalogCoverageStatus;
  sourceStatus?: CatalogSourceStatus;
  search?: string;
  showSearch?: boolean;
}

/**
 * Seção principal de listagem de produtos.
 *
 * Organismo que compõe a estrutura completa da área de produtos:
 * - Barra de abas de filtro por categoria
 * - Contador de produtos, seletor de itens por página e alternador de visualização
 * - Sidebar de filtros (preço e categorias)
 * - Listagem de produtos em grid ou lista
 *
 * Os filtros são exibidos de forma responsiva: em dispositivos móveis
 * ficam acima do grid, em desktop ficam na lateral esquerda.
 *
 * @example
 * ```tsx
 * <ProductsSection />
 * ```
 */
export function ProductsSection({
  basePath = "/produtos",
  activeCollection = "todos",
  showCollectionFilters = false,
  products,
  tabs,
  selectedTypes,
  minPrice,
  maxPrice,
  totalItems,
  totalPages,
  currentPage,
  activeType,
  viewMode,
  perPage,
  coverageCep = null,
  coverageStatus = "not_requested",
  sourceStatus = "ok",
  search = "",
  showSearch = false,
}: Readonly<ProductsSectionProps>) {
  const showCoverageWarning = coverageStatus === "unavailable";
  const isSourceUnavailable = sourceStatus === "unavailable";
  let emptyMessage = "Nenhum produto encontrado.";

  if (coverageStatus === "applied" && coverageCep) {
    emptyMessage = "Em breve atenderemos sua região.";
  } else if (search) {
    emptyMessage = `Nenhum produto encontrado para “${search}”.`;
  }

  return (
    <ProductAvailabilityProvider productIds={products.map((product) => product.id)}>
      <section className="bg-white py-8">
        <AddToCartToastHost />
        <CoverageWarningToastHost shouldShow={showCoverageWarning} />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {showSearch ? (
            <div className="mb-6">
              <ProductSearch initialValue={search} totalItems={totalItems} />
            </div>
          ) : null}
          {/* Filter Tabs */}
          {showCollectionFilters ? (
            <div className="mb-4">
              <ProductCollectionFilters
                basePath={basePath}
                activeCollection={activeCollection}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                viewMode={viewMode}
                perPage={perPage}
              />
            </div>
          ) : null}

          <div className="mb-6">
            <ProductFilterTabs
              basePath={basePath}
              collection={activeCollection}
              activeTab={activeType}
              tabs={tabs}
              minPrice={minPrice}
              maxPrice={maxPrice}
              viewMode={viewMode}
              perPage={perPage}
              search={search}
            />
          </div>

          {/* Products count and view toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {isSourceUnavailable ? (
                "Catálogo indisponível no momento"
              ) : (
                <>
                  <span className="font-bold text-brand-dark">{totalItems}</span>{" "}
                  produtos encontrados
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ProductsPerPageSelector
                basePath={basePath}
                collection={activeCollection}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                viewMode={viewMode}
                perPage={perPage}
              />
              <ViewToggle
                basePath={basePath}
                collection={activeCollection}
                activeView={viewMode}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                perPage={perPage}
                search={search}
              />
            </div>
          </div>

          {/* Main content: Sidebar + Grid */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <ProductFilterSidebar
              basePath={basePath}
              collection={activeCollection}
              selectedTypes={selectedTypes}
              minPrice={minPrice}
              maxPrice={maxPrice}
              viewMode={viewMode}
              perPage={perPage}
              search={search}
              categories={tabs.map((tab) => ({ id: tab.id, label: tab.id === "todos" ? "Todos" : tab.label }))}
            />

            {/* Products Grid */}
            <div className="flex-1">
              {isSourceUnavailable ? (
                <CatalogUnavailableNotice />
              ) : (
                <>
                  <ProductsGrid
                    emptyMessage={emptyMessage}
                    emptyAction={search ? <ClearProductSearchButton /> : undefined}
                    products={products}
                    viewMode={viewMode}
                  />
                  <ProductsPagination
                    basePath={basePath}
                    collection={activeCollection}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    selectedTypes={selectedTypes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    viewMode={viewMode}
                    perPage={perPage}
                    search={search}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </ProductAvailabilityProvider>
  );
}
