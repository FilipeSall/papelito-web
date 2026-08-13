import { ProductListCard } from "./product-list-card";
import type { ProductGridItem } from "./product-grid-card";

interface ProductsListProps {
  products: ProductGridItem[];
  variant?: "default" | "collection";
}

export function ProductsList({ products, variant = "default" }: Readonly<ProductsListProps>) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-text-muted">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {products.map((product) => (
        <ProductListCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
}
