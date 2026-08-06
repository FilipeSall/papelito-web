"use client";

import { decreaseQuantity, increaseQuantity } from "./product-detail-helpers";

interface ProductDetailQuantitySelectorProps {
  quantity: number;
  availableStock: number | null;
  disabled: boolean;
  onQuantityChange: (quantity: number) => void;
}

export function ProductDetailQuantitySelector({
  quantity,
  availableStock,
  disabled,
  onQuantityChange,
}: Readonly<ProductDetailQuantitySelectorProps>) {
  const isQuantityAtMax = availableStock !== null && quantity >= availableStock;

  return (
    <div className="mt-8 flex items-center gap-4">
      <span className="text-sm font-normal leading-5 tracking-[-0.150391px] text-[#6A7282]">Quantidade:</span>
      <div className="flex h-10.5 w-30.5 items-center rounded-full border border-[#E5E7EB] bg-white px-px">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
          disabled={disabled || quantity <= 1}
          onClick={() => onQuantityChange(decreaseQuantity(quantity))}
        >
          <span className="text-sm leading-none">−</span>
        </button>
        <span className="w-10 text-center text-base font-black leading-6 tracking-[-0.3125px] text-brand-dark">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#6A7282] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
          disabled={disabled || isQuantityAtMax}
          onClick={() => onQuantityChange(increaseQuantity(quantity, availableStock))}
        >
          <span className="text-sm leading-none">+</span>
        </button>
      </div>
    </div>
  );
}
