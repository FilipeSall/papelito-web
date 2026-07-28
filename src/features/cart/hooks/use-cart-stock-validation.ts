"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCartStock,
  type CartStockEntry,
} from "../services/get-cart-stock";
import { useCartStore } from "../store/use-cart-store";
import {
  reconcileCartStock,
  stockLimitMessage,
  type CartStockIssue,
} from "../utils/reconcile-cart-stock";

export type CartStockValidationOutcome =
  | { status: "valid" }
  | { status: "changed" }
  | { status: "blocked"; message: string };

function buildStockItems() {
  const items = useCartStore.getState().items;
  const stockItems = items
    .map((item) => ({
      productId: Number(item.id),
      vendorId: item.vendorId,
    }))
    .filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isInteger(item.vendorId) &&
        item.vendorId > 0,
    );

  return stockItems.length === items.length ? stockItems : null;
}

function omitIssue(
  issues: Record<string, CartStockIssue>,
  productId: string,
) {
  const nextIssues = { ...issues };
  delete nextIssues[productId];
  return nextIssues;
}

export function useCartStockValidation(options?: { validateOnMount?: boolean }) {
  const validateOnMount = options?.validateOnMount ?? false;
  const setItemQuantityIfCurrent = useCartStore(
    (state) => state.setItemQuantityIfCurrent,
  );
  const [products, setProducts] = useState<Record<string, CartStockEntry>>({});
  const [issues, setIssues] = useState<Record<string, CartStockIssue>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingProductIdsRef = useRef(new Set<string>());
  const didValidateOnMountRef = useRef(false);

  const validateStock = useCallback(async (): Promise<CartStockValidationOutcome> => {
    const items = useCartStore.getState().items;
    if (items.length === 0) {
      setProducts({});
      setIssues({});
      setGlobalError(null);
      return { status: "valid" };
    }

    const stockItems = buildStockItems();
    if (!stockItems) {
      const message = "O carrinho contém itens inválidos para validar o estoque.";
      setGlobalError(message);
      return { status: "blocked", message };
    }

    setIsValidating(true);
    const result = await getCartStock(stockItems);
    setIsValidating(false);

    if (result.status !== "ok") {
      setGlobalError(result.message);
      return { status: "blocked", message: result.message };
    }

    const reconciliation = reconcileCartStock(items, result.products);
    for (const adjustment of reconciliation.adjustments) {
      setItemQuantityIfCurrent(
        adjustment.productId,
        adjustment.expectedQuantity,
        adjustment.quantity,
      );
    }

    setProducts(result.products);
    setIssues(reconciliation.issues);
    setGlobalError(null);

    if (reconciliation.adjustments.length > 0) {
      return { status: "changed" };
    }

    if (!reconciliation.canContinue) {
      return {
        status: "blocked",
        message: "Revise os itens sem estoque antes de continuar.",
      };
    }

    return { status: "valid" };
  }, [setItemQuantityIfCurrent]);

  useEffect(() => {
    if (!validateOnMount || didValidateOnMountRef.current) return;

    didValidateOnMountRef.current = true;
    void validateStock();
  }, [validateOnMount, validateStock]);

  const increaseItem = useCallback(
    async (productId: string) => {
      if (pendingProductIdsRef.current.has(productId)) return;

      const item = useCartStore
        .getState()
        .items.find((currentItem) => currentItem.id === productId);
      const numericProductId = Number(productId);

      if (
        !item ||
        !Number.isInteger(numericProductId) ||
        numericProductId <= 0 ||
        !Number.isInteger(item.vendorId) ||
        item.vendorId <= 0
      ) {
        setGlobalError("Não foi possível validar este item do carrinho.");
        return;
      }

      pendingProductIdsRef.current.add(productId);
      setPendingProductIds(new Set(pendingProductIdsRef.current));

      try {
        const result = await getCartStock([
          { productId: numericProductId, vendorId: item.vendorId },
        ]);

        if (result.status !== "ok") {
          setGlobalError(result.message);
          return;
        }

        const stock = result.products[productId];
        if (!stock) {
          setGlobalError("Não foi possível validar o estoque deste produto.");
          return;
        }

        setProducts((current) => ({ ...current, [productId]: stock }));
        setGlobalError(null);

        if (!stock.available || stock.stockQty <= 0) {
          setIssues((current) => ({
            ...current,
            [productId]: {
              type: "out_of_stock",
              message: "Este produto está sem estoque no momento.",
            },
          }));
          return;
        }

        const nextQuantity = item.quantity + 1;
        if (nextQuantity > stock.stockQty) {
          setIssues((current) => ({
            ...current,
            [productId]: {
              type: "limited",
              message: stockLimitMessage(stock.stockQty),
            },
          }));
          return;
        }

        if (
          setItemQuantityIfCurrent(
            productId,
            item.quantity,
            nextQuantity,
          )
        ) {
          setIssues((current) => omitIssue(current, productId));
        }
      } finally {
        pendingProductIdsRef.current.delete(productId);
        setPendingProductIds(new Set(pendingProductIdsRef.current));
      }
    },
    [setItemQuantityIfCurrent],
  );

  const clearIssue = useCallback((productId: string) => {
    setIssues((current) =>
      current[productId]?.type === "limited"
        ? omitIssue(current, productId)
        : current,
    );
  }, []);

  return {
    products,
    issues,
    globalError,
    isValidating,
    isItemPending: (productId: string) => pendingProductIds.has(productId),
    validateStock,
    increaseItem,
    clearIssue,
  };
}
