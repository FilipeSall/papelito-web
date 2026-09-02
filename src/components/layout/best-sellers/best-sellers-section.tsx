import { Shelf, ShelfLabel } from "@/components/ui";
import { ProductCard } from "../flash-sale/product-card";
import type { HomeProductCard } from "@/features/catalog";

interface BestSellersSectionProps {
  products: HomeProductCard[];
}

const LABEL_ID = "prateleira-nossos-produtos";

/**
 * Primeira prateleira do corredor: os mais vendidos, em cards grandes.
 */
export function BestSellersSection({ products }: Readonly<BestSellersSectionProps>) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={LABEL_ID} className="w-full bg-transparent pt-4">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="flex flex-col">
          <ShelfLabel
            href="/produtos"
            id={LABEL_ID}
            linkText="Ver todos os produtos"
            size="lead"
            title="Nossos produtos"
          />

          <div className="pt-8">
            <Shelf labelledBy={LABEL_ID}>
              {products.map((product) => (
                <li className="w-73 shrink-0 snap-start" key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </Shelf>
          </div>
        </div>
      </div>
    </section>
  );
}
