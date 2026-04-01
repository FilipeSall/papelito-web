import { CountdownTimer } from "./countdown-timer";
import { FlashSaleBadge } from "./flash-sale-badge";
import { ProductCard } from "./product-card";
import type { HomeProductCard } from "@/features/catalog";

interface FlashSaleSectionProps {
  products: HomeProductCard[];
}

/**
 * Seção de oferta relâmpago exibida abaixo do CategoriesNav.
 *
 * Apresenta cabeçalho com badge destacado e contador regressivo, seguido
 * por quatro cards de produto com descontos em destaque. O fundo escuro
 * (#231F20) contrasta com os cards brancos dos produtos.
 */
export function FlashSaleSection({ products }: FlashSaleSectionProps) {
  return (
    <section className="w-full bg-[#231F20] pt-12 pb-12">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-8">
          {/* Header: badge + countdown */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FlashSaleBadge />
              <span className="text-sm leading-5 tracking-[-0.150391px] text-white/50">
                Acabando hoje!
              </span>
            </div>
            <CountdownTimer />
          </div>

          {/* Product grid */}
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
