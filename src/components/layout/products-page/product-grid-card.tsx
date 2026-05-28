"use client";

import Link from "next/link";
import { AddToCartButton, ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";

/**
 * Ícone de estrela para rating.
 */
function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 1L7.41 4.05L10.8 4.32L8.28 6.52L9.05 9.84L6 8.03L2.95 9.84L3.72 6.52L1.2 4.32L4.59 4.05L6 1Z"
        fill="#FFE500"
        stroke="#FFE500"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/**
 * Dados de um produto para exibição no grid.
 */
export interface ProductGridItem {
  id: string;
  /** Categoria do produto (ex: "Seda") */
  category: string;
  /** Nome do produto */
  name: string;
  /** Rótulo do badge (ex: "Essencial", "Clássico", "Orgânico") */
  badge: string;
  /** Preço original (riscado) */
  originalPrice: number;
  /** Preço atual */
  price: number;
  /** Nota de 0 a 5 */
  rating: number;
  /** Número de avaliações */
  reviews: number;
  /** Caminho da imagem */
  image?: string;
}

interface ProductGridCardProps {
  product: ProductGridItem;
}

/**
 * Card de produto para o grid da página de produtos.
 *
 * Componente atômico que exibe um produto individual no grid.
 * Inclui badge amarelo de categoria, imagem, informações do produto,
 * avaliação por estrelas, preços e botão de adicionar.
 *
 * @example
 * ```tsx
 * <ProductGridCard
 *   product={{
 *     id: "1",
 *     category: "Seda",
 *     name: "Piteira Tradicional",
 *     badge: "Essencial",
 *     originalPrice: 8.90,
 *     price: 6.90,
 *     rating: 4.4,
 *     reviews: 678,
 *     image: "/images/products/piteira.png",
 *   }}
 * />
 * ```
 */
export function ProductGridCard({ product }: ProductGridCardProps) {
  const { isUnavailable, disabledReason } = useProductAvailability(product.id);
  const {
    category,
    name,
    originalPrice,
    price,
    rating,
    reviews,
    image,
  } = product;

  return (
    <div className="group/availability relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-md">
      <div className={isUnavailable ? "opacity-45 transition-opacity" : undefined}>
        <Link
          href={`/produtos/${product.id}`}
          aria-label={`Ver produto ${name}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
        />
        {/* Image container */}
        <div className="relative aspect-square bg-bg-light p-4">
          {/* Product Image */}
          <div className="relative w-full h-full">
            {image ? (
              <ImageWithSkeleton
                src={image}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                imageClassName="object-contain p-2"
                fallback={<ProductImageFallback className="h-full w-full" />}
              />
            ) : (
              <ProductImageFallback className="absolute inset-0" />
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <span className="text-xs text-text-muted">{category}</span>

          {/* Name */}
          <h3 className="font-bold text-sm text-brand-dark mt-0.5 line-clamp-1">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            <StarIcon />
            <span className="text-xs text-text-secondary font-medium">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-text-muted">({reviews})</span>
          </div>

          {/* Price and Add Button */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-base font-bold text-brand-dark">
                R$ {price.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-xs text-text-muted line-through">
                R$ {originalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <AddToCartButton
              label="Adicionar"
              className="relative z-20 min-w-26 w-auto px-3"
              disabledReason={disabledReason}
              product={{
                id: product.id,
                category,
                name,
                image,
                price,
                originalPrice,
              }}
            />
          </div>
        </div>
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
