import { StarRating, ProductPrice, AddToCartButton } from "@/components/ui";

interface ProductCardInfoProps {
  id: string;
  category: string;
  name: string;
  image?: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  price: number;
}

export function ProductCardInfo({
  id,
  category,
  name,
  image,
  rating,
  reviews,
  originalPrice,
  price,
}: ProductCardInfoProps) {
  return (
    <div className="flex-1 px-4 pt-4 pb-4 flex flex-col">
      <span className="text-xs leading-4 text-text-muted">{category}</span>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-brand-dark mt-0.5">
        {name}
      </span>
      <div className="mt-1">
        <StarRating rating={rating} count={reviews} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <ProductPrice original={originalPrice} current={price} />
        <AddToCartButton
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
  );
}
