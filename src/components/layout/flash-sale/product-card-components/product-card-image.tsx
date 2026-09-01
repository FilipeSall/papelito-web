import {
  ImageWithSkeleton,
  ProductImageFallback,
  CategoryBadge,
  DiscountBadge,
} from "@/components/ui";

interface ProductCardImageProps {
  image?: string;
  name: string;
  badge: string;
  discount: number;
  compactOnMobile?: boolean;
}

export function ProductCardImage({
  image,
  name,
  badge,
  discount,
  compactOnMobile = false,
}: ProductCardImageProps) {
  return (
    <div
      className={`relative h-48 w-full shrink-0 border-b-2 border-brand-dark bg-[#faf8f2] ${
        compactOnMobile ? "h-[191.994px] sm:h-48" : ""
      }`}
    >
      {image ? (
        <div
          className={`absolute left-4 top-6 h-36 w-65 ${
            compactOnMobile
              ? "left-4 right-4 top-6 h-[143.998px] w-auto sm:right-auto sm:h-36 sm:w-65"
              : ""
          }`}
        >
          <ImageWithSkeleton
            src={image}
            alt={name}
            fill
            sizes={compactOnMobile ? "(max-width: 500px) 131px, 260px" : "260px"}
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
