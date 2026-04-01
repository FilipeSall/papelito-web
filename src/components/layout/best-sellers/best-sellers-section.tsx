import Link from "next/link";
import { SectionHeader } from "@/components/ui";
import { ProductCard } from "../flash-sale/product-card";
import { BEST_SELLER_PRODUCTS } from "./constants";

/**
 * Ícone de seta para a direita usado no botão de ação principal.
 */
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Seção "Nossos Produtos" / "Mais Vendidos".
 *
 * Organismo composto que exibe:
 * - Cabeçalho com emoji, rótulo "Mais Vendidos", título "NOSSOS PRODUTOS"
 *   e link "Ver todos" no canto superior direito
 * - Grid 4x2 de cards de produto reutilizando o `ProductCard` existente
 * - Botão centralizado "Ver todos os produtos" no rodapé da seção
 *
 * Utiliza composição reutilizando componentes atômicos (`StarRating`,
 * `AddToCartButton`) e moleculares (`ProductCard`) da seção flash-sale.
 *
 * @example
 * ```tsx
 * <BestSellersSection />
 * ```
 */
export function BestSellersSection() {
  return (
    <section className="w-full bg-white py-14">
      <div className="max-w-450 mx-auto px-43.5">
        <div className="w-full max-w-304 mx-auto flex flex-col gap-8">
          {/* Header */}
          <SectionHeader
            emoji="🔥"
            label="Mais Vendidos"
            title={"NOSSOS\nPRODUTOS"}
            href="/produtos"
            linkText="Ver todos"
          />

          {/* Product grid 4x2 */}
          <div className="grid grid-cols-4 gap-5">
            {BEST_SELLER_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="flex justify-center pt-4">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 bg-brand-dark text-white px-8 py-4 rounded-full hover:opacity-80 transition-opacity"
            >
              <span className="font-black text-base leading-6 tracking-[-0.3125px] uppercase">
                Ver todos os produtos
              </span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
