"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/ui";
import type { CartProductInput } from "@/features/cart";

interface ProductListCartControlsProps {
  product: CartProductInput;
  disabledReason?: string;
  variant?: "default" | "collection";
}

export function ProductListCartControls({
  product,
  disabledReason,
  variant = "default",
}: ProductListCartControlsProps) {
  const [quantity, setQuantity] = useState(1);
  const isDisabled = Boolean(disabledReason);

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className={variant === "collection" ? "font-black uppercase tracking-[0.12em]" : undefined}>Qtd.</span>
        <div className={`flex h-9 items-center bg-white px-1.5 ${variant === "collection" ? "border-2 border-[#1a1a1a]" : "rounded-full border border-gray-200"}`}>
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={isDisabled}
            className={`flex h-7 w-7 items-center justify-center text-text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant === "collection" ? "hover:bg-brand-yellow hover:text-brand-dark" : "rounded-full hover:bg-gray-100 hover:text-brand-dark"}`}
            onClick={() => setQuantity((previous) => Math.max(1, previous - 1))}
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-black text-brand-dark">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={isDisabled}
            className={`flex h-7 w-7 items-center justify-center text-text-muted transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant === "collection" ? "hover:bg-brand-yellow hover:text-brand-dark" : "rounded-full hover:bg-gray-100 hover:text-brand-dark"}`}
            onClick={() => setQuantity((previous) => previous + 1)}
          >
            +
          </button>
        </div>
      </div>

      <AddToCartButton
        label="Adicionar"
        quantity={quantity}
        product={product}
        disabledReason={disabledReason}
        className={variant === "collection" ? "h-9 min-w-35 px-4 sm:w-auto" : "h-9 min-w-35 rounded-full px-4 text-[11px] tracking-wide uppercase sm:w-auto"}
        variant={variant}
      />
    </div>
  );
}
