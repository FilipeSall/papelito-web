import { ImageWithSkeleton, ProductImageFallback, CategoryBadge, DiscountBadge } from "@/components/ui";

interface ProductCardImageProps {
  image?: string;
  name: string;
  badge: string;
  discount: number;
}

export function ProductCardImage({
  image,
  name,
  badge,
  discount,
}: ProductCardImageProps) {
  return (
    <div className="relative h-48 w-full shrink-0 bg-bg-light">
      {image ? (
        <div className="absolute left-4 top-6 w-65 h-36">
          <ImageWithSkeleton
            src={image}
            alt={name}
            fill
            sizes="260px"
            imageClassName="object-contain"
            fallback={<ProductImageFallback className="h-full w-full" />}
          />
        </div>
      ) : (
        <ProductImageFallback className="absolute inset-0" />
      )}

      <CategoryBadge label={badge} />
      <DiscountBadge discount={discount} />
    </div>
  );
}
