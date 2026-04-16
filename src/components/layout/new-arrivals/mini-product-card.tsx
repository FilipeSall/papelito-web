"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent } from "react";
import { ImageWithSkeleton, ProductImageFallback, DiscountBadge, ProductPrice, AddToCartButton } from "@/components/ui";

interface MiniProductCardProps {
  id: string;
  name: string;
  category?: string;
  originalPrice: number;
  price: number;
  discount: number;
  image?: string;
}

export function MiniProductCard({
  id,
  name,
  category = "Novidades",
  originalPrice,
  price,
  discount,
  image,
}: MiniProductCardProps) {
  const router = useRouter();

  function navigateToProduct() {
    if (image) {
      router.push(`/produtos/${id}?img=${encodeURIComponent(image)}`);
      return;
    }

    router.push(`/produtos/${id}`);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToProduct();
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Ver produto ${name}`}
      onClick={navigateToProduct}
      onKeyDown={handleCardKeyDown}
      className="relative h-65.5 w-44 shrink-0 snap-start select-none overflow-hidden rounded-xl border border-[#F3F4F6] bg-white p-px shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] flex cursor-pointer flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
    >
      <div className="relative h-36 w-full bg-bg-light">
        {image ? (
          <div className="absolute inset-x-0 top-4 h-28">
            <ImageWithSkeleton
              src={image}
              alt={name}
              fill
              sizes="174px"
              imageClassName="pointer-events-none select-none object-contain"
              fallback={<ProductImageFallback className="h-full w-full" />}
            />
          </div>
        ) : (
          <ProductImageFallback className="absolute inset-0 rounded-t-xl" />
        )}

        <DiscountBadge discount={discount} />
      </div>

      <div className="flex-1 w-full p-3 flex flex-col">
        <div className="flex flex-col gap-1">
          <span className="font-black text-xs leading-4 text-brand-dark truncate">
            {name}
          </span>
          <ProductPrice original={originalPrice} current={price} />
        </div>

        <div className="mt-auto pt-3" onClick={(event) => event.stopPropagation()}>
          <AddToCartButton
            label="Adicionar"
            product={{
              id,
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
  );
}
