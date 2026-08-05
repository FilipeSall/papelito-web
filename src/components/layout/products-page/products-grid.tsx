import { ProductGridCard, type ProductGridItem } from "./product-grid-card";
import { ProductsList } from "./products-list";
import type { ReactNode } from "react";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";

interface ProductsGridProps {
  /** Lista de produtos para exibir no grid */
  products: ProductGridItem[];
  viewMode: ProductsViewMode;
  emptyMessage?: string;
  emptyAction?: ReactNode;
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
  emptyAction,
}: Readonly<ProductsGridProps>) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-text-muted">{emptyMessage}</p>
        {emptyAction}
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
