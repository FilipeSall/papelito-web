import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import { ProductCategoryBadge } from "./product-category-badge";
import { ProductDiscountBadge } from "./product-discount-badge";

interface ProductCardImageProps {
  image?: string;
  name: string;
  badge: string;
  discount: number;
}

/**
 * Container atômico de imagem do produto.
 *
 * Área com fundo claro (`bg-bg-light`) que encapsula a imagem do produto,
 * o badge de categoria e o badge de desconto. Utiliza `ProductImageFallback`
 * quando nenhuma imagem é fornecida.
 */
export function ProductCardImage({
  image,
  name,
  badge,
  discount,
}: ProductCardImageProps) {
  return (
    <div className="relative w-73 h-48 bg-bg-light shrink-0">
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

      <ProductCategoryBadge label={badge} />
      <ProductDiscountBadge discount={discount} />
    </div>
  );
}
