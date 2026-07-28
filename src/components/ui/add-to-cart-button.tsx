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
  disabledReason?: string;
  onClick?: () => void;
  onAdded?: () => void;
}

export function AddToCartButton({
  label,
  product,
  quantity = 1,
  className = "",
  disabledReason,
  onClick,
  onAdded,
}: AddToCartButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const applyVendorToCart = useCartStore((state) => state.applyVendorToCart);
  const items = useCartStore((state) => state.items);
  const { isAuthenticated, isLoading, isRoleLoading, isB2bPurchaseBlocked, isNotBuyer } =
    useAuthSession();
  const [isResolving, setIsResolving] = useState(false);
	const b2bBlockedMessage = "Sua empresa ainda não está apta para comprar. Revise o cadastro empresarial.";
  const notBuyerMessage = "Esta conta não possui um contexto de customer habilitado para compra.";
  const blockedMessage = disabledReason ?? (isB2bPurchaseBlocked ? b2bBlockedMessage : (isNotBuyer ? notBuyerMessage : undefined));
  const isPurchaseBlockedByRole = isNotBuyer || isB2bPurchaseBlocked;
  const isDisabled =
    isResolving || isLoading || isRoleLoading || isPurchaseBlockedByRole || Boolean(disabledReason);
  const roleTooltipMessage = disabledReason
    ? undefined
		: isB2bPurchaseBlocked
			? b2bBlockedMessage
			: isNotBuyer
				? notBuyerMessage
				: undefined;

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
          ? "CEP necessário"
          : result.status === "vendor_conflict"
            ? "Vendor indisponível"
            : "Disponibilidade indisponível",
      message: result.message,
      tone: result.status === "vendor_conflict" ? "warning" : "error",
      href: result.href,
      actionLabel: result.status === "missing_cep" ? "Cadastrar CEP" : undefined,
    });
  }

  async function handleClick() {
    if (disabledReason) {
      return;
    }

    if (product) {
      if (isPurchaseBlockedByRole || isLoading || isRoleLoading || isResolving) return;

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
          title: "Disponibilidade indisponível",
          message: "Não foi possível validar a disponibilidade por CEP agora.",
          tone: "error",
        });
        return;
      } finally {
        setIsResolving(false);
      }
    }

    onClick?.();
  }

  function renderRoleTooltip() {
    if (!roleTooltipMessage) {
      return null;
    }

    const tooltipClassName = label
      ? "left-1/2 -translate-x-1/2"
      : "right-0 left-auto translate-x-0";

    return (
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-40 mb-2 w-max max-w-48 rounded-lg bg-brand-dark px-3 py-2 text-center text-[11px] font-black leading-4 text-white opacity-0 shadow-[0_12px_24px_rgba(35,31,32,0.25)] transition-opacity group-hover/admin-tooltip:opacity-100 group-focus-within/admin-tooltip:opacity-100 ${tooltipClassName}`.trim()}
      >
        {roleTooltipMessage}
      </span>
    );
  }

  if (label) {
    const labelText = disabledReason
      ? "Indisponível"
      : isResolving
        ? "Validando"
        : label;

    return (
      <span className="group/admin-tooltip relative inline-flex w-full">
        {renderRoleTooltip()}
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label="Adicionar ao carrinho"
          aria-disabled={isDisabled}
          title={blockedMessage}
          className={`flex cursor-pointer items-center justify-center gap-1.5 w-full h-7 bg-brand-dark rounded-[10px] hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
        >
          <CartIcon className="size-3 text-white" />
          <span className="font-black text-xs leading-4 text-white">{labelText}</span>
        </button>
      </span>
    );
  }

  return (
    <span className="group/admin-tooltip relative inline-flex">
      {renderRoleTooltip()}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Adicionar ao carrinho"
        aria-disabled={isDisabled}
        title={blockedMessage}
        className={`flex cursor-pointer items-center justify-center w-9 h-9 bg-brand-dark rounded-[14px] shrink-0 hover:opacity-80 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      >
        <CartIcon className="size-4 text-white" />
      </button>
    </span>
  );
}
