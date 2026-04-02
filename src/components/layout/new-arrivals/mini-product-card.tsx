import { ImageWithSkeleton, ProductImageFallback, DiscountBadge, ProductPrice, AddToCartButton } from "@/components/ui";

interface MiniProductCardProps {
  name: string;
  originalPrice: number;
  price: number;
  discount: number;
  image?: string;
}

export function MiniProductCard({
  name,
  originalPrice,
  price,
  discount,
  image,
}: MiniProductCardProps) {
  return (
    <div className="h-65.5 w-44 shrink-0 snap-start select-none overflow-hidden rounded-xl border border-[#F3F4F6] bg-white p-px shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] flex flex-col items-start">
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

        <div className="mt-auto pt-3">
          <AddToCartButton label="Adicionar" />
        </div>
      </div>
    </div>
  );
}
