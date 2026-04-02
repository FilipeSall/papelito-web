import { SectionHeader } from "@/components/ui";
import { MiniProductCard } from "./mini-product-card";
import type { HomeNewArrivalProduct } from "@/features/catalog";

interface NewArrivalsSectionProps {
  products: HomeNewArrivalProduct[];
}

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  return (
    <section className="w-full bg-white py-12 select-none">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-6">
          <SectionHeader
            emoji="✨"
            title="Recém Chegados"
            href="/novidades"
            variant="compact"
          />

          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-4 px-1">
              {products.map((product) => (
                <MiniProductCard
                  key={product.id}
                  name={product.name}
                  originalPrice={product.originalPrice}
                  price={product.price}
                  discount={product.discount}
                  image={product.image}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
