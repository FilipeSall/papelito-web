"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartIcon } from "./icons";
import type { CartProductInput, ResolveCartVendorResult } from "@/features/cart";
import { resolveCartVendor, useCartStore } from "@/features/cart";
import { useAuthSession } from "@/hooks/use-auth-session";

export const ADD_TO_CART_EVENT_NAME = "papelito:add-to-cart";

export type AddToCartEventDetail = {
  productName?: string;
  title?: string;
  message?: string;
  tone?: "success" | "warning" | "error";
  href?: string;
  actionLabel?: string;
};

interface AddToCartButtonProps {
  label?: string;
  product?: CartProductInput;
  quantity?: number;
  className?: string;
  onClick?: () => void;
  onAdded?: () => void;
}

export function AddToCartButton({
  label,
  product,
  quantity = 1,
  className = "",
  onClick,
  onAdded,
}: AddToCartButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const applyVendorToCart = useCartStore((state) => state.applyVendorToCart);
  const items = useCartStore((state) => state.items);
  const { isAuthenticated, isSeller, isLoading } = useAuthSession();
  const [isResolving, setIsResolving] = useState(false);
  const sellerBlockedMessage = "Vendors nao compram pela plataforma.";
  const isDisabled = isResolving || isSeller;

  function dispatchCartEvent(detail: AddToCartEventDetail) {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<AddToCartEventDetail>(ADD_TO_CART_EVENT_NAME, {
        detail,
      }),
    );
  }

  function dispatchResolveFailure(result: Exclude<ResolveCartVendorResult, { status: "ok" }>) {
    dispatchCartEvent({
      title:
        result.status === "missing_cep"
          ? "CEP necessario"
          : result.status === "vendor_conflict"
            ? "Vendor indisponivel"
            : "Disponibilidade indisponivel",
      message: result.message,
      tone: result.status === "vendor_conflict" ? "warning" : "error",
      href: result.href,
      actionLabel: result.status === "missing_cep" ? "Cadastrar CEP" : undefined,
    });
  }

  async function handleClick() {
    if (product) {
      if (isSeller || isLoading || isResolving) return;

      if (!isAuthenticated) {
        router.push("/entrar");
        return;
      }

      setIsResolving(true);

      try {
        const result = await resolveCartVendor({
          product: {
            id: product.id,
            quantity,
          },
          currentItems: items,
        });

        if (result.status !== "ok") {
          dispatchResolveFailure(result);
          return;
        }

        applyVendorToCart(result.vendor);
        addItem(
          {
            ...product,
            ...result.vendor,
          },
          quantity,
        );

        dispatchCartEvent({
          productName: product.name,
          tone: "success",
        });
        onAdded?.();
      } catch {
        dispatchCartEvent({
          title: "Disponibilidade indisponivel",
          message: "Nao foi possivel validar a disponibilidade por CEP agora.",
          tone: "error",
        });
        return;
      } finally {
        setIsResolving(false);
      }
    }

    onClick?.();
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Adicionar ao carrinho"
        aria-disabled={isDisabled}
        title={isSeller ? sellerBlockedMessage : undefined}
        className={`flex cursor-pointer items-center justify-center gap-1.5 w-full h-7 bg-brand-dark rounded-[10px] hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      >
        <CartIcon className="size-3 text-white" />
        <span className="font-black text-xs leading-4 text-white">
          {isSeller ? sellerBlockedMessage : isResolving ? "Validando" : label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Adicionar ao carrinho"
      aria-disabled={isDisabled}
      title={isSeller ? sellerBlockedMessage : undefined}
      className={`flex cursor-pointer items-center justify-center w-9 h-9 bg-brand-dark rounded-[14px] shrink-0 hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      <CartIcon className="size-4 text-white" />
    </button>
  );
}
