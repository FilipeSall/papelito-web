import { ProductGridCard, type ProductGridItem } from "./product-grid-card";
import { ProductsList } from "./products-list";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductsGridProps {
  /** Lista de produtos para exibir no grid */
  products: ProductGridItem[];
  viewMode: ProductsViewMode;
  emptyMessage?: string;
}

/**
 * Grid de produtos da página de listagem.
 *
 * Componente molecular que organiza os cards de produtos em um layout
 * responsivo de grid. Exibe 1 coluna em mobile, 2 em tablets e 3 em desktop.
 *
 * @example
 * ```tsx
 * <ProductsGrid products={products} />
 * ```
 */
export function ProductsGrid({
  products,
  viewMode,
  emptyMessage = "Nenhum produto encontrado.",
}: ProductsGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return <ProductsList products={products} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductGridCard key={product.id} product={product} />
      ))}
    </div>
  );
}
