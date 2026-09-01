"use client";

import Link from "next/link";
import { ProductCardImage, ProductCardInfo } from "./product-card-components";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";
import type { HomeProductCard } from "@/features/catalog/types/home-products";

interface ProductCardProps {
  product: HomeProductCard;
  compactOnMobile?: boolean;
  /** Sobre fundo preto a moldura e a sombra viram amarelas — em preto sumiriam. */
  onDark?: boolean;
}

/**
 * Card molecular de produto para a seção de oferta relâmpago.
 *
 * Organismo composto que exibe:
 * - Container de imagem com badges de categoria (amarelo) e desconto (vermelho)
 * - Seção de informações com nome, classificação, preços e botão de compra
 *
 * Quando `featured` é `true`, aplica borda amarela com sombra elevada ao card.
 * Reutiliza componentes atômicos (`ProductCardImage`, `ProductCardInfo`,
 * `ProductPrice`, `ProductDiscountBadge`, `ProductCategoryBadge`) e
 * moleculares existentes (`AddToCartButton`).
 *
 * @example
 * ```tsx
 * <ProductCard
 *   product={{
 *     id: 1,
 *     category: "Papel",
 *     name: "Alfafa King Size",
 *     badge: "Tradicional",
 *     discount: 20,
 *     originalPrice: 29.90,
 *     price: 23.90,
 *     image: "/images/products/example.png",
 *     featured: false,
 *   }}
 * />
 * ```
 */
export function ProductCard({
  product,
  compactOnMobile = false,
  onDark = false,
}: Readonly<ProductCardProps>) {
  const { isUnavailable, disabledReason, stockLabel } = useProductAvailability(product.id);
  const {
    id,
    category,
    name,
    badge,
    discount,
    originalPrice,
    price,
    image,
    promotionContext,
  } = product;
  const plateColor = onDark ? "bg-brand-yellow" : "bg-brand-dark";
  const borderColor = onDark ? "border-brand-yellow" : "border-brand-dark";

  return (
    <div
      className={`group/availability relative isolate h-82.5 w-full max-w-73 cursor-pointer overflow-visible transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        compactOnMobile
          ? "h-[329.982px] w-full max-w-none sm:h-82.5 sm:max-w-73"
          : ""
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-0 ${plateColor} translate-x-[6px] translate-y-[6px] rotate-[1.2deg] [clip-path:polygon(1%_2%,98%_0,100%_95%,94%_100%,0_97%)] transition-transform duration-200 ease-out group-hover/availability:translate-x-[8px] group-hover/availability:translate-y-[8px] motion-reduce:transition-none motion-reduce:group-hover/availability:translate-x-[6px] motion-reduce:group-hover/availability:translate-y-[6px]`}
      />
      <div
        className={`relative z-10 h-full overflow-hidden rounded-[2px_5px_12px_4px] border-2 ${borderColor} bg-white ${isUnavailable ? "opacity-45 transition-opacity" : ""}`.trim()}
      >
        <Link
          href={`/produtos/${id}`}
          aria-label={`Ver produto ${name}`}
          className="absolute inset-0 z-10"
        />
        <ProductCardImage
          image={image}
          name={name}
          badge={badge}
          discount={discount}
          compactOnMobile={compactOnMobile}
        />
        <ProductCardInfo
          id={id}
          category={category}
          name={name}
          image={image}
          stockLabel={stockLabel}
          originalPrice={originalPrice}
          price={price}
          promotionContext={promotionContext}
          disabledReason={disabledReason}
        />
      </div>
      {isUnavailable ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-3 right-3 top-3 z-30 border-2 border-brand-yellow bg-brand-dark px-3 py-2 text-center text-[11px] font-black uppercase leading-4 tracking-[0.08em] text-brand-yellow opacity-0 transition-opacity group-hover/availability:opacity-100 group-focus-within/availability:opacity-100"
        >
          {disabledReason}
        </span>
      ) : null}
    </div>
  );
}
