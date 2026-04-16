"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/ui";
import type { CartProductInput } from "@/features/cart";

interface ProductListCartControlsProps {
  product: CartProductInput;
}

export function ProductListCartControls({ product }: ProductListCartControlsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>Qtd.</span>
        <div className="flex h-9 items-center rounded-full border border-gray-200 bg-white px-1.5">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gray-100 hover:text-brand-dark"
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
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gray-100 hover:text-brand-dark"
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
        className="h-9 min-w-35 rounded-full px-4 text-[11px] tracking-wide uppercase sm:w-auto"
      />
    </div>
  );
}
