import { Shelf, ShelfLabel } from "@/components/ui";
import { MiniProductCard } from "./mini-product-card";
import type { HomeNewArrivalProduct } from "@/features/catalog";

interface NewArrivalsSectionProps {
  products: HomeNewArrivalProduct[];
}

const LABEL_ID = "prateleira-recem-chegados";

/**
 * Segunda prateleira do corredor: as novidades, em cards menores e mais densos —
 * a fileira muda de peso para o corredor não virar acordeão.
 */
export function NewArrivalsSection({ products }: Readonly<NewArrivalsSectionProps>) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={LABEL_ID} className="w-full bg-transparent pb-16 pt-4">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="flex flex-col">
          <ShelfLabel
            href="/novidades"
            id={LABEL_ID}
            linkText="Ver novidades"
            title="Recém chegados"
            tone="yellow"
          />

          <div className="pt-8">
            <Shelf gap="tight" labelledBy={LABEL_ID} rule="none">
              {products.map((product) => (
                <li className="shrink-0 snap-start" key={product.id}>
                  <MiniProductCard
                    discount={product.discount}
                    id={product.id}
                    image={product.image}
                    name={product.name}
                    originalPrice={product.originalPrice}
                    price={product.price}
                  />
                </li>
              ))}
            </Shelf>
          </div>
        </div>
      </div>
    </section>
  );
}
