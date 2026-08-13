"use client";

import Link from "next/link";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { ProductListCartControls } from "./product-list-cart-controls";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";
import type { ProductGridItem } from "./product-grid-card";

interface ProductListCardProps {
  product: ProductGridItem;
  variant?: "default" | "collection";
}

export function ProductListCard({ product, variant = "default" }: ProductListCardProps) {
  const { isUnavailable, disabledReason, stockLabel } = useProductAvailability(product.id);
  const {
    category,
    name,
    originalPrice,
    price,
    image,
    promotionContext,
  } = product;

  return (
    <article className={`group/availability relative bg-white p-4 ${
      variant === "collection"
        ? "border-2 border-[#1a1a1a] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a1a1a]"
        : "rounded-2xl border border-gray-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
    }`}>
      <div className={isUnavailable ? "opacity-45 transition-opacity" : undefined}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/produtos/${product.id}`}
            aria-label={`Ver produto ${name}`}
            className={`group flex min-w-0 flex-1 items-center gap-3 ${
              variant === "collection"
                ? "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-yellow"
                : "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            }`}
          >
            <div className={`relative h-24 w-24 shrink-0 overflow-hidden p-2 ${
              variant === "collection" ? "border-2 border-[#1a1a1a] bg-[#faf8f2]" : "rounded-xl bg-bg-light"
            }`}>
              {image ? (
                <ImageWithSkeleton
                  src={image}
                  alt={name}
                  fill
                  sizes="96px"
                  imageClassName="object-contain p-1.5"
                  fallback={<ProductImageFallback className="h-full w-full" />}
                />
              ) : (
                <ProductImageFallback className="absolute inset-0" />
              )}
            </div>

            <div className="min-w-0">
              <p className={variant === "collection" ? "text-[10px] font-black uppercase tracking-[0.12em] text-text-muted" : "text-xs text-text-muted"}>{category}</p>
              <h3 className={variant === "collection" ? "mt-1 line-clamp-2 text-sm font-black uppercase leading-5 text-brand-dark group-hover:underline" : "mt-0.5 line-clamp-2 text-sm font-black leading-5 text-brand-dark group-hover:underline"}>
                {name}
              </h3>
              <p className="mt-1.5 text-xs text-text-muted">{stockLabel}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base font-black text-brand-dark">
                  R$ {price.toFixed(2).replace(".", ",")}
                </span>
                {originalPrice > price ? (
                  <span className="text-xs text-text-muted line-through">
                    R$ {originalPrice.toFixed(2).replace(".", ",")}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>

          <div className="sm:pl-4">
            <ProductListCartControls
              disabledReason={disabledReason}
              variant={variant}
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
          className="pointer-events-none absolute left-4 right-4 top-4 z-30 rounded-lg bg-brand-dark px-3 py-2 text-center text-[11px] font-black leading-4 text-white opacity-0 shadow-[0_12px_24px_rgba(35,31,32,0.25)] transition-opacity group-hover/availability:opacity-100 group-focus-within/availability:opacity-100"
        >
          {disabledReason}
        </span>
      ) : null}
    </article>
  );
}
