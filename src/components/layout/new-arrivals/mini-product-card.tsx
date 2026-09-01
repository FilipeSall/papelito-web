"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent } from "react";
import { ImageWithSkeleton, ProductImageFallback, DiscountBadge, ProductPrice, AddToCartButton } from "@/components/ui";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";

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
  const { isUnavailable, disabledReason, stockLabel } = useProductAvailability(id);

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
      className="group/availability relative isolate flex h-65.5 w-44 shrink-0 cursor-pointer select-none flex-col items-start overflow-visible transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-brand-dark translate-x-[4px] translate-y-[4px] rotate-[1.2deg] [clip-path:polygon(1%_2%,98%_0,100%_95%,94%_100%,0_97%)] transition-transform duration-200 ease-out group-hover/availability:translate-x-[6px] group-hover/availability:translate-y-[6px] motion-reduce:transition-none motion-reduce:group-hover/availability:translate-x-[4px] motion-reduce:group-hover/availability:translate-y-[4px]"
      />
      <div
        className={`relative z-10 flex h-full w-full flex-col overflow-hidden rounded-[2px_5px_10px_4px] border-2 border-brand-dark bg-white ${
          isUnavailable ? "opacity-45 transition-opacity" : ""
        }`.trim()}
      >
        <div className="relative h-36 w-full border-b-2 border-brand-dark bg-[#faf8f2]">
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
            <ProductImageFallback className="absolute inset-0" />
          )}

          <DiscountBadge discount={discount} />
        </div>

        <div className="flex-1 w-full p-3 flex flex-col">
          <div className="flex flex-col gap-1">
            <span className="truncate text-xs font-black uppercase leading-4 tracking-[0.01em] text-brand-dark">
              {name}
            </span>
            <span className="text-[11px] leading-3.5 text-text-tertiary" data-numeric>
              {stockLabel}
            </span>
            <span data-numeric>
              <ProductPrice current={price} original={originalPrice} />
            </span>
          </div>

          <div className="mt-auto pt-3" onClick={(event) => event.stopPropagation()}>
            <AddToCartButton
              label="Adicionar"
              disabledReason={disabledReason}
              variant="collection"
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
      {isUnavailable ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-2 right-2 top-2 z-30 border-2 border-brand-yellow bg-brand-dark px-2.5 py-2 text-center text-[10px] font-black uppercase leading-[14px] tracking-[0.08em] text-brand-yellow opacity-0 transition-opacity group-hover/availability:opacity-100 group-focus/availability:opacity-100"
        >
          {disabledReason}
        </span>
      ) : null}
    </div>
  );
}
