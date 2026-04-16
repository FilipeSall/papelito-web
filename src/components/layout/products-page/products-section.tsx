import { ProductFilterTabs } from "./product-filter-tabs";
import { ProductFilterSidebar } from "./product-filter-sidebar";
import { ProductsGrid } from "./products-grid";
import { ProductsPagination } from "./products-pagination";
import { ProductsPerPageSelector } from "./products-per-page-selector";
import { ViewToggle } from "./view-toggle";
import { AddToCartToastHost } from "./add-to-cart-toast-host";
import type {
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogTab,
} from "@/features/catalog";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductsSectionProps {
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
}: ProductsSectionProps) {
  return (
    <section className="bg-white py-8">
      <AddToCartToastHost />
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <ProductFilterTabs
            activeTab={activeType}
            tabs={tabs}
            minPrice={minPrice}
            maxPrice={maxPrice}
            viewMode={viewMode}
            perPage={perPage}
          />
        </div>

        {/* Products count and view toggle */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-brand-dark">{totalItems}</span>{" "}
            produtos encontrados
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ProductsPerPageSelector
              selectedTypes={selectedTypes}
              minPrice={minPrice}
              maxPrice={maxPrice}
              viewMode={viewMode}
              perPage={perPage}
            />
            <ViewToggle
              activeView={viewMode}
              selectedTypes={selectedTypes}
              minPrice={minPrice}
              maxPrice={maxPrice}
              currentPage={currentPage}
              perPage={perPage}
            />
          </div>
        </div>

        {/* Main content: Sidebar + Grid */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <ProductFilterSidebar
            selectedTypes={selectedTypes}
            minPrice={minPrice}
            maxPrice={maxPrice}
            viewMode={viewMode}
            perPage={perPage}
          />

          {/* Products Grid */}
          <div className="flex-1">
            <ProductsGrid products={products} viewMode={viewMode} />
            <ProductsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              selectedTypes={selectedTypes}
              minPrice={minPrice}
              maxPrice={maxPrice}
              viewMode={viewMode}
              perPage={perPage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
