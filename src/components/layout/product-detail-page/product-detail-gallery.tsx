"use client";

import { useMemo, useState } from "react";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import type { ProductDetailItem } from "@/features/catalog";
import { resolveThumbnails } from "./product-detail-helpers";

interface ProductDetailGalleryProps {
  product: ProductDetailItem;
}

export function ProductDetailGallery({ product }: Readonly<ProductDetailGalleryProps>) {
  const thumbnails = useMemo(
    () => resolveThumbnails(product, product.isKit ? Number.POSITIVE_INFINITY : undefined),
    [product],
  );
  const [selectedThumbId, setSelectedThumbId] = useState<string | null>(null);

  const selectedThumb = thumbnails.find((thumb) => thumb.id === selectedThumbId) ?? thumbnails[0];
  const shouldShowThumbnails = thumbnails.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] sm:h-96 sm:p-10">
        {product.discountPercent > 0 ? (
          <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-brand-yellow px-3 py-1 text-xs font-black leading-4 text-brand-dark">
            -{product.discountPercent}%
          </div>
        ) : null}
        <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-full bg-[#231F20] px-3 py-1 text-xs font-black leading-4 text-white">
          {product.badge}
        </div>
        {selectedThumb?.image ? (
          <ImageWithSkeleton
            src={selectedThumb.image}
            alt={selectedThumb.name}
            fill
            sizes="486px"
            imageClassName="object-contain"
            fallback={<ProductImageFallback className="h-full w-full" />}
          />
        ) : (
          <ProductImageFallback className="h-full w-full" />
        )}
      </div>

      {shouldShowThumbnails ? (
        <div className="grid grid-cols-4 gap-3">
          {thumbnails.map((thumb) => (
            <button
              key={thumb.id}
              type="button"
              aria-label={`Selecionar miniatura ${thumb.name}`}
              onClick={() => setSelectedThumbId(thumb.id)}
              className={`relative h-19 w-full overflow-hidden rounded-3.5 border-2 bg-white px-3 py-2 transition ${
                selectedThumb?.id === thumb.id
                  ? "border-brand-yellow"
                  : "border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              <ImageWithSkeleton
                src={thumb.image!}
                alt={thumb.name}
                fill
                sizes="120px"
                imageClassName="object-contain p-1"
                fallback={<ProductImageFallback className="h-full w-full" />}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
