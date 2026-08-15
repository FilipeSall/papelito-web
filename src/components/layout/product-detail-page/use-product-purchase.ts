"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ADD_TO_CART_EVENT_NAME,
  type AddToCartEventDetail,
} from "@/components/ui/add-to-cart-button";
import {
  resolveCartVendor,
  useCartStore,
  type CartItem,
  type CartVendor,
  type ResolveCartVendorResult,
  type ResolvedCartProductInput,
} from "@/features/cart";
import type { ProductDetailItem } from "@/features/catalog";
import type { RegionBlock } from "@/features/catalog/types/region-block";
import { useAuthSession } from "@/hooks/use-auth-session";

type ResolveCartVendorFailure = Exclude<ResolveCartVendorResult, { status: "ok" }>;

type PurchaseGate =
  | { action: "ignore" }
  | { action: "signin" }
  | { action: "blocked"; detail: AddToCartEventDetail; clampTo?: number }
  | { action: "proceed" };

interface PurchaseGateInput {
  isSessionSettling: boolean;
  isAuthenticated: boolean;
  isPurchaseBlockedByRole: boolean;
  isAddingToCart: boolean;
  regionBlock: RegionBlock | null;
  availableStock: number | null;
  quantity: number;
}

interface CommitCartAdditionInput {
  product: ProductDetailItem;
  quantity: number;
  cartItems: CartItem[];
  addItem: (product: ResolvedCartProductInput, quantity?: number) => void;
  applyVendorToCart: (vendor: CartVendor) => void;
}

interface UseProductPurchaseOptions {
  product: ProductDetailItem;
  quantity: number;
  availableStock: number | null;
  regionBlock: RegionBlock | null;
  onQuantityClamp: (quantity: number) => void;
}

const RESOLVE_FAILURE_TITLES: Record<ResolveCartVendorFailure["status"], string> = {
  missing_cep: "CEP necessário",
  unavailable: "Disponibilidade indisponível",
  vendor_conflict: "Vendor indisponível",
};

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

function dispatchResolveFailure(result: ResolveCartVendorFailure) {
  dispatchCartEvent({
    title: RESOLVE_FAILURE_TITLES[result.status],
    message: result.message,
    tone: result.status === "vendor_conflict" ? "warning" : "error",
    href: result.href,
    actionLabel: result.status === "missing_cep" ? "Cadastrar CEP" : undefined,
  });
}

function resolveRoleBlockedMessage(isAdministrator: boolean, isSeller: boolean) {
  if (isAdministrator) {
    return "Admins não compram pela plataforma.";
  }

  if (isSeller) {
    return "Vendors não compram pela plataforma.";
  }

  return undefined;
}

function resolvePurchaseGate(input: PurchaseGateInput): PurchaseGate {
  if (input.isSessionSettling || input.isPurchaseBlockedByRole || input.isAddingToCart) {
    return { action: "ignore" };
  }

  if (!input.isAuthenticated) {
    return { action: "signin" };
  }

  if (input.regionBlock !== null) {
    return {
      action: "blocked",
      detail: {
        title: "Indisponível na sua regiao",
        message: input.regionBlock.message,
        tone: "warning",
      },
    };
  }

  if (input.availableStock !== null && input.availableStock <= 0) {
    return {
      action: "blocked",
      detail: {
        title: "Produto indisponível",
        message: "O vendor selecionado está sem estoque deste produto.",
        tone: "warning",
      },
    };
  }

  if (input.availableStock !== null && input.quantity > input.availableStock) {
    return {
      action: "blocked",
      clampTo: input.availableStock,
      detail: {
        title: "Estoque limitado",
        message: `Este vendor tem ${input.availableStock} unidade(s) disponível(is).`,
        tone: "warning",
      },
    };
  }

  return { action: "proceed" };
}

function applyPurchaseBlock(
  gate: Extract<PurchaseGate, { action: "blocked" }>,
  onQuantityClamp: (quantity: number) => void,
) {
  if (gate.clampTo !== undefined) {
    onQuantityClamp(gate.clampTo);
  }

  dispatchCartEvent(gate.detail);
}

async function commitCartAddition({
  product,
  quantity,
  cartItems,
  addItem,
  applyVendorToCart,
}: CommitCartAdditionInput) {
  try {
    const result = await resolveCartVendor({
      product: {
        id: product.id,
        quantity,
      },
      currentItems: cartItems,
    });

    if (result.status !== "ok") {
      dispatchResolveFailure(result);
      return false;
    }

    applyVendorToCart(result.vendor);
    addItem(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        promotionContext: product.promotionContext,
        ...result.vendor,
      },
      quantity,
    );

    dispatchCartEvent({
      productName: product.name,
      tone: "success",
    });

    return true;
  } catch {
    dispatchCartEvent({
      title: "Disponibilidade indisponível",
      message: "Não foi possível validar a disponibilidade por CEP agora.",
      tone: "error",
    });

    return false;
  }
}

export function useProductPurchase({
  product,
  quantity,
  availableStock,
  regionBlock,
  onQuantityClamp,
}: UseProductPurchaseOptions) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const applyVendorToCart = useCartStore((state) => state.applyVendorToCart);
  const cartItems = useCartStore((state) => state.items);
  const { status, isAdministrator, isSeller, isRoleLoading } = useAuthSession();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isPurchaseBlockedByRole = isAdministrator || isSeller;
  const isOutOfStock = availableStock !== null && availableStock <= 0;
  const isRegionBlocked = regionBlock !== null;
  const shouldShowRegionNotice = isRegionBlocked && status !== "loading" && !isAdministrator;

  async function addCurrentProductToCart() {
    const gate = resolvePurchaseGate({
      isSessionSettling: status === "loading" || isRoleLoading,
      isAuthenticated: status === "authenticated",
      isPurchaseBlockedByRole,
      isAddingToCart,
      regionBlock,
      availableStock,
      quantity,
    });

    switch (gate.action) {
      case "signin":
        router.push(
          `/entrar?feedback=cart_login_required&callbackUrl=${encodeURIComponent(`/produtos/${product.id}`)}`,
        );
        return false;
      case "blocked":
        applyPurchaseBlock(gate, onQuantityClamp);
        return false;
      case "ignore":
        return false;
      default:
        break;
    }

    setIsAddingToCart(true);

    try {
      return await commitCartAddition({
        product,
        quantity,
        cartItems,
        addItem,
        applyVendorToCart,
      });
    } finally {
      setIsAddingToCart(false);
    }
  }

  async function buyNow() {
    const added = await addCurrentProductToCart();

    if (!added) {
      return;
    }

    router.push("/carrinho");
  }

  return {
    isAddingToCart,
    isOutOfStock,
    isPurchaseDisabled: isOutOfStock || isRegionBlocked,
    isPurchaseBlockedByRole,
    roleBlockedMessage: resolveRoleBlockedMessage(isAdministrator, isSeller),
    regionNotice: shouldShowRegionNotice ? regionBlock : null,
    addToCart: () => {
      void addCurrentProductToCart();
    },
    buyNow: () => {
      void buyNow();
    },
  };
}
