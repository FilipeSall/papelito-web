"use client";

import Link from "next/link";
import { ProductCardImage, ProductCardInfo } from "./product-card-components";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";
import type { HomeProductCard } from "@/features/catalog/types/home-products";

interface ProductCardProps {
  product: HomeProductCard;
  compactOnMobile?: boolean;
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
}: ProductCardProps) {
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
    featured,
  } = product;

  return (
    <div
      className={`group/availability relative h-82.5 w-full max-w-73 cursor-pointer overflow-visible rounded-xl bg-white ${
        compactOnMobile
          ? "h-[329.982px] w-full max-w-none sm:h-82.5 sm:max-w-73"
          : ""
      } ${
        featured
          ? "shadow-[0px_0px_0px_2px_#FFE500,0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
          : "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
      }`}
    >
      <div
        className={`overflow-hidden rounded-xl ${isUnavailable ? "opacity-45 transition-opacity" : ""}`.trim()}
      >
        <Link
          href={`/produtos/${id}`}
          aria-label={`Ver produto ${name}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
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
          disabledReason={disabledReason}
        />
      </div>
      {isUnavailable ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-3 right-3 top-3 z-30 rounded-lg bg-brand-dark px-3 py-2 text-center text-[11px] font-black leading-4 text-white opacity-0 shadow-[0_12px_24px_rgba(35,31,32,0.25)] transition-opacity group-hover/availability:opacity-100 group-focus-within/availability:opacity-100"
        >
          {disabledReason}
        </span>
      ) : null}
    </div>
  );
}
