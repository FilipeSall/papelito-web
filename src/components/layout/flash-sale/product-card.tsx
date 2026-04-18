import Link from "next/link";
import { ProductCardImage, ProductCardInfo } from "./product-card-components";
import type { HomeProductCard } from "@/features/catalog";

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
 * moleculares existentes (`StarRating`, `AddToCartButton`).
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
 *     rating: 4.5,
 *     reviews: 128,
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
  const {
    id,
    category,
    name,
    badge,
    discount,
    originalPrice,
    price,
    rating,
    reviews,
    image,
    featured,
  } = product;

  return (
    <div
      className={`relative h-82.5 w-full max-w-73 cursor-pointer overflow-hidden rounded-xl bg-white ${
        compactOnMobile
          ? "h-[329.982px] w-full max-w-none sm:h-82.5 sm:max-w-73"
          : ""
      } ${
        featured
          ? "shadow-[0px_0px_0px_2px_#FFE500,0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
          : "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
      }`}
    >
      <Link
        href={{
          pathname: `/produtos/${id}`,
          query: image ? { img: image } : undefined,
        }}
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
        rating={rating}
        reviews={reviews}
        originalPrice={originalPrice}
        price={price}
      />
    </div>
  );
}
