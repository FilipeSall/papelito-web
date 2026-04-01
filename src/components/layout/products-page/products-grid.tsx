import { ProductGridCard, type ProductGridItem } from "./product-grid-card";

interface ProductsGridProps {
  /** Lista de produtos para exibir no grid */
  products: ProductGridItem[];
}

/**
 * Grid de produtos da página de listagem.
 *
 * Componente molecular que organiza os cards de produtos em um layout
 * responsivo de grid. Exibe 1 coluna em mobile, 2 em tablets e 3 em desktop.
 *
 * @example
 * ```tsx
 * <ProductsGrid products={PRODUCTS_LIST} />
 * ```
 */
export function ProductsGrid({ products }: ProductsGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-muted text-sm">
          Nenhum produto encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductGridCard key={product.id} product={product} />
      ))}
    </div>
  );
}
