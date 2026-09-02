import { ProductFilterTabs } from "./product-filter-tabs";
import { ProductCollectionFilters } from "./product-collection-filters";
import { ProductFilterSidebar } from "./product-filter-sidebar";
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
  ProductsCatalogCategory,
  ProductsCatalogItem,
  ProductsCatalogTab,
} from "@/features/catalog";
import type {
  ProductsGridLayout,
  ProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

interface ProductsSectionProps {
  basePath?: string;
  activeCollection?: ProductCollectionId;
  showCollectionFilters?: boolean;
  showCategoryFilters?: boolean;
  showCategoryTabs?: boolean;
  products: ProductsCatalogItem[];
  tabs: ProductsCatalogTab[];
  categoryTree?: ProductsCatalogCategory[];
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  selectedSubcategories?: string[];
  minPrice: number | null;
  maxPrice: number | null;
  priceError?: string;
  rawMinPrice?: string | null;
  rawMaxPrice?: string | null;
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
  gridLayout?: ProductsGridLayout;
}

/**
 * Seção principal de listagem de produtos.
 *
 * Organismo que compõe a estrutura completa da área de produtos:
 * - Barra de abas de filtro por categoria
 * - Contador de produtos, seletor de itens por página e alternador de visualização
 * - Listagem de produtos em grid ou lista
 *
 * Os filtros de coleção e categoria ficam acima da listagem em todos os breakpoints.
 * O acabamento visual é o mesmo em toda superfície de catálogo; `gridLayout` só muda a
 * densidade do grid quando a listagem ocupa a largura cheia, sem sidebar.
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
  showCategoryFilters = true,
  showCategoryTabs = true,
  products,
  tabs,
  categoryTree = [],
  selectedTypes,
  selectedSubcategories = [],
  minPrice,
  maxPrice,
  priceError,
  rawMinPrice,
  rawMaxPrice,
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
  gridLayout = "default",
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
          {showCollectionFilters ? (
            <div className="mb-4">
              <ProductCollectionFilters
                activeCollection={activeCollection}
                viewMode={viewMode}
                perPage={perPage}
                search={search}
              />
            </div>
          ) : null}

          {showSearch ? (
            <div className="mb-6">
              <ProductSearch
                basePath={basePath}
                initialValue={search}
                totalItems={totalItems}
              />
            </div>
          ) : null}

          {showCategoryFilters && showCategoryTabs ? (
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
          ) : null}

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
            <div className="flex flex-wrap items-stretch gap-2">
              <ProductsPerPageSelector
                basePath={basePath}
                collection={activeCollection}
                selectedSubcategories={selectedSubcategories}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                viewMode={viewMode}
                gridLayout={gridLayout}
                perPage={perPage}
                search={search}
                totalItems={totalItems}
              />
              <ViewToggle
                basePath={basePath}
                collection={activeCollection}
                activeView={viewMode}
                selectedSubcategories={selectedSubcategories}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                perPage={perPage}
                gridLayout={gridLayout}
                search={search}
              />
            </div>
          </div>

          <div className={showCategoryFilters ? "flex flex-col gap-6 md:flex-row" : undefined}>
            {showCategoryFilters ? (
              <ProductFilterSidebar
                basePath={basePath}
                categoryTree={categoryTree}
                collection={activeCollection}
                selectedSubcategories={selectedSubcategories}
                selectedTypes={selectedTypes}
                minPrice={minPrice}
                maxPrice={maxPrice}
                priceError={priceError}
                rawMinPrice={rawMinPrice}
                rawMaxPrice={rawMaxPrice}
                viewMode={viewMode}
                perPage={perPage}
                search={search}
                categories={tabs.map((tab) => ({
                  id: tab.id,
                  label: tab.id === "todos" ? "Todos" : tab.label,
                }))}
              />
            ) : null}
            <div className={showCategoryFilters ? "min-w-0 flex-1" : undefined}>
              {isSourceUnavailable ? (
                <CatalogUnavailableNotice />
              ) : (
                <>
                  <ProductsGrid
                    emptyMessage={emptyMessage}
                    emptyAction={search ? <ClearProductSearchButton basePath={basePath} /> : undefined}
                    products={products}
                    gridLayout={gridLayout}
                    viewMode={viewMode}
                  />
                  <ProductsPagination
                    basePath={basePath}
                    collection={activeCollection}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    selectedSubcategories={selectedSubcategories}
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
