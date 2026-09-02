"use client";

import Link from "next/link";
import {
  AddToCartButton,
  ImageWithSkeleton,
  ProductImageFallback,
} from "@/components/ui";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";

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
  /** Caminho da imagem */
  image?: string;
  href?: string;
  promotionContext?: string;
}

interface ProductGridCardProps {
  product: ProductGridItem;
}

/**
 * Card de produto para o grid da página de produtos.
 *
 * Componente atômico que exibe um produto individual no grid.
 * Inclui imagem, informações do produto, estoque regional, preços
 * e botão de adicionar. É o mesmo card em toda superfície de catálogo
 * — vitrine, categorias e coleções.
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
 *     image: "/images/products/piteira.png",
 *   }}
 * />
 * ```
 */
export function ProductGridCard({ product }: Readonly<ProductGridCardProps>) {
  const { isUnavailable, disabledReason, stockLabel } = useProductAvailability(
    product.id,
  );
  const {
    category,
    name,
    originalPrice,
    price,
    image,
    href,
    promotionContext,
  } = product;

  return (
    <article className="group/availability relative cursor-pointer overflow-visible rounded-xl bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-md">
      <div
        className={`overflow-hidden rounded-xl ${isUnavailable ? "opacity-45 transition-opacity" : ""}`.trim()}
      >
        <Link
          href={href ?? `/produtos/${product.id}`}
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
          <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-brand-dark">
            {name}
          </h3>

          <p className="mt-1.5 text-xs text-text-muted">{stockLabel}</p>

          {/* Price and Add Button */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="whitespace-nowrap text-base font-bold text-brand-dark">
                R$ {price.toFixed(2).replace(".", ",")}
              </span>
              {originalPrice > price ? (
                <span className="whitespace-nowrap text-xs text-text-muted line-through">
                  R$ {originalPrice.toFixed(2).replace(".", ",")}
                </span>
              ) : null}
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
                promotionContext,
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
    </article>
  );
}
