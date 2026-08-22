"use client";

import { AddToCartButton } from "@/components/ui";
import { useProductAvailability } from "@/features/catalog/hooks/use-product-availability";

type KitDetailAddToCartProps = {
  id: string;
  category: string;
  image?: string;
  name: string;
  originalPrice: number;
  price: number;
};

export function KitDetailAddToCart(props: KitDetailAddToCartProps) {
  const { disabledReason } = useProductAvailability(props.id);

  return (
    <AddToCartButton
      className="mt-7 h-12 px-5"
      disabledReason={disabledReason}
      label="Adicionar ao carrinho"
      product={props}
    />
  );
}
