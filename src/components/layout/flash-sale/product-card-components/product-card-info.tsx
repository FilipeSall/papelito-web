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
  compactOnMobile?: boolean;
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
  compactOnMobile = false,
}: ProductCardInfoProps) {
  return (
    <div className="flex-1 px-4 pt-4 pb-4 flex flex-col">
      <span className="text-xs leading-4 text-text-muted">{category}</span>
      <span className="font-black text-sm leading-5 tracking-[-0.150391px] text-brand-dark mt-0.5">
        {name}
      </span>
      <span className="mt-1 text-xs leading-4 text-text-muted">{stockLabel}</span>
      <div className={`flex items-center justify-between ${compactOnMobile ? "mt-auto pt-3" : "mt-3"}`}>
        <ProductPrice original={originalPrice} current={price} />
        <AddToCartButton
          className="relative z-20"
          disabledReason={disabledReason}
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
