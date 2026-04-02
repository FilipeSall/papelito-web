import { CountdownTimer } from "./countdown-timer";
import { ProductCard } from "./product-card";
import type { HomeProductCard } from "@/features/catalog";
import { FlashSaleBadge } from "@/components/ui";

interface FlashSaleSectionProps {
  products: HomeProductCard[];
}

export function FlashSaleSection({ products }: FlashSaleSectionProps) {
  return (
    <section className="w-full bg-[#231F20] pt-12 pb-12">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FlashSaleBadge />
              <span className="text-sm leading-5 tracking-[-0.150391px] text-white/50">
                Acabando hoje!
              </span>
            </div>
            <CountdownTimer />
          </div>

          <div className="flex flex-row justify-center gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
