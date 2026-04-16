import { ProductCard } from "./product-card";
import type { HomeProductCard } from "@/features/catalog";
import { FlashSaleBadge } from "@/components/ui";

import { CountdownTimerNoSSR } from "./countdown-timer-no-ssr";

interface FlashSaleSectionProps {
  products: HomeProductCard[];
}

export function FlashSaleSection({ products }: FlashSaleSectionProps) {
  return (
    <section className="w-full bg-[#231F20] pt-12 pb-12">
      <div className="mx-auto max-w-450 px-4 sm:px-6 lg:px-8 xl:px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <FlashSaleBadge />
              <span className="text-sm leading-5 tracking-[-0.150391px] text-white/50">
                Acabando hoje!
              </span>
            </div>
            <CountdownTimerNoSSR />
          </div>

          <div className="flex flex-wrap justify-center gap-4 xl:flex-nowrap">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
