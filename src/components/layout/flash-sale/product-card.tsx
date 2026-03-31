import Image from "next/image";
import { AddToCartButton } from "./add-to-cart-button";
import { StarRating } from "./star-rating";
import type { FlashSaleProduct } from "./constants";

interface ProductCardProps {
  product: FlashSaleProduct;
}

/**
 * Card molecular de produto para a seção de oferta relâmpago.
 *
 * Exibe imagem em fundo claro com badges de categoria (amarelo) e desconto
 * (vermelho), nome, classificação por estrelas e preços. Quando `featured`,
 * aplica borda amarela com sombra elevada ao card.
 */
export function ProductCard({ product }: ProductCardProps) {
  const {
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

  const originalFormatted = originalPrice.toFixed(2).replace(".", ",");
  const priceFormatted = price.toFixed(2).replace(".", ",");

  return (
    <div
      className={`relative w-[292px] h-[330px] bg-white rounded-[16px] overflow-hidden flex flex-col shrink-0 ${
        featured
          ? "shadow-[0px_0px_0px_2px_#FFE500,0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
          : "shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
      }`}
    >
      {/* Image container */}
      <div className="relative w-[292px] h-[192px] bg-bg-light shrink-0">
        <div className="absolute left-4 top-6 w-[260px] h-[144px]">
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain"
            sizes="260px"
          />
        </div>

        {/* Category badge */}
        <div className="absolute top-2 left-2 flex items-center px-2 py-0.5 bg-brand-yellow rounded-full">
          <span className="font-black text-xs leading-4 text-brand-dark whitespace-nowrap">
            {badge}
          </span>
        </div>

        {/* Discount badge */}
        <div className="absolute top-2 right-2 flex items-center px-2 py-0.5 bg-[#FB2C36] rounded-full">
          <span className="font-black text-xs leading-4 text-white whitespace-nowrap">
            -{discount}%
          </span>
        </div>
      </div>

      {/* Info container */}
      <div className="flex-1 px-4 pt-4 pb-4 flex flex-col">
        <span className="text-xs leading-4 text-text-muted">{category}</span>
        <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-brand-dark mt-0.5">
          {name}
        </span>
        <div className="mt-1">
          <StarRating rating={rating} count={reviews} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
            <span className="text-xs leading-3 text-text-muted line-through">
              R$ {originalFormatted}
            </span>
            <span className="font-black text-lg leading-[22px] tracking-[-0.439453px] text-brand-dark">
              R$ {priceFormatted}
            </span>
          </div>
          <AddToCartButton />
        </div>
      </div>
    </div>
  );
}
