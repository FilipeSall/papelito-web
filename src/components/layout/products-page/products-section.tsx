import { ProductFilterTabs } from "./product-filter-tabs";
import { ProductFilterSidebar } from "./product-filter-sidebar";
import { ProductsGrid } from "./products-grid";
import { ProductsPagination } from "./products-pagination";
import { ViewToggle } from "./view-toggle";
import type {
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogTab,
} from "@/features/catalog";

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
}

/**
 * Seção principal de listagem de produtos.
 *
 * Organismo que compõe a estrutura completa da área de produtos:
 * - Barra de abas de filtro por categoria
 * - Contador de produtos e alternador de visualização
 * - Sidebar de filtros (preço e categorias)
 * - Grid de cards de produtos
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
}: ProductsSectionProps) {
  return (
    <section className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <ProductFilterTabs
            activeTab={activeType}
            tabs={tabs}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>

        {/* Products count and view toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">
            <span className="font-bold text-brand-dark">{totalItems}</span>{" "}
            produtos encontrados
          </p>
          <ViewToggle activeView="grid" />
        </div>

        {/* Main content: Sidebar + Grid */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <ProductFilterSidebar
            selectedTypes={selectedTypes}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />

          {/* Products Grid */}
          <div className="flex-1">
            <ProductsGrid products={products} />
            <ProductsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              activeType={activeType}
              selectedTypes={selectedTypes}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
