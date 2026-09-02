import { ProductGridCard, type ProductGridItem } from "./product-grid-card";
import { ProductsList } from "./products-list";
import type { ReactNode } from "react";
import type {
  ProductsGridLayout,
  ProductsViewMode,
} from "@/features/catalog/utils/products-listing-preferences";

interface ProductsGridProps {
  /** Lista de produtos para exibir no grid */
  products: ProductGridItem[];
  viewMode: ProductsViewMode;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  gridLayout?: ProductsGridLayout;
}

/**
 * Grid de produtos da página de listagem.
 *
 * Componente molecular que organiza os cards de produtos em um layout
 * responsivo de grid. O card e o espaçamento são os mesmos em toda
 * superfície de catálogo; só a densidade muda: a listagem com sidebar
 * chega a três colunas e a de coleção, sem sidebar, aproveita a largura
 * cheia para uma quarta coluna em telas grandes.
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
  gridLayout = "default",
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

  const gridClassName =
    gridLayout === "collection"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClassName}>
      {products.map((product) => (
        <ProductGridCard key={product.id} product={product} />
      ))}
    </div>
  );
}
