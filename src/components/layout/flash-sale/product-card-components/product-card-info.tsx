import { ProductPrice, AddToCartButton } from "@/components/ui";

interface ProductCardInfoProps {
  id: string;
  category: string;
  name: string;
  image?: string;
  stockLabel: string;
  originalPrice: number;
  price: number;
  promotionContext?: string;
  disabledReason?: string;
}

export function ProductCardInfo({
  id,
  category,
  name,
  image,
  stockLabel,
  originalPrice,
  price,
  promotionContext,
  disabledReason,
}: ProductCardInfoProps) {
  return (
    <div className="flex-1 px-4 pt-4 pb-4 flex flex-col">
      <span className="text-[0.625rem] font-black uppercase leading-4 tracking-[0.16em] text-text-secondary">
        {category}
      </span>
      <span className="mt-1 text-sm font-black uppercase leading-5 tracking-[0.01em] text-brand-dark">
        {name}
      </span>
      <span className="mt-1 text-[0.6875rem] leading-4 text-text-tertiary" data-numeric>
        {stockLabel}
      </span>
      <div className="mt-auto flex items-end justify-between gap-2 pt-3" data-numeric>
        <ProductPrice original={originalPrice} current={price} />
        <AddToCartButton
          className="relative z-20"
          disabledReason={disabledReason}
          variant="collection"
          product={{
            id,
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
  );
}
