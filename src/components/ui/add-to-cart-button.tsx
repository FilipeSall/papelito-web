"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CartIcon } from "./icons";
import type { CartProductInput } from "@/features/cart";
import { useCartStore } from "@/features/cart";

export const ADD_TO_CART_EVENT_NAME = "papelito:add-to-cart";

interface AddToCartButtonProps {
  label?: string;
  product?: CartProductInput;
  quantity?: number;
  className?: string;
  onClick?: () => void;
}

export function AddToCartButton({
  label,
  product,
  quantity = 1,
  className = "",
  onClick,
}: AddToCartButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { status } = useSession();

  function handleClick() {
    if (product) {
      if (status === "loading") return;

      if (status !== "authenticated") {
        router.push("/entrar");
        return;
      }

      addItem(product, quantity);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(ADD_TO_CART_EVENT_NAME, {
            detail: {
              productName: product.name,
            },
          }),
        );
      }
    }

    onClick?.();
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Adicionar ao carrinho"
        className={`flex cursor-pointer items-center justify-center gap-1.5 w-full h-7 bg-brand-dark rounded-[10px] hover:opacity-80 transition-opacity ${className}`.trim()}
      >
        <CartIcon className="size-3 text-white" />
        <span className="font-black text-xs leading-4 text-white">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Adicionar ao carrinho"
      className={`flex cursor-pointer items-center justify-center w-9 h-9 bg-brand-dark rounded-[14px] shrink-0 hover:opacity-80 transition-opacity ${className}`.trim()}
    >
      <CartIcon className="size-4 text-white" />
    </button>
  );
}
