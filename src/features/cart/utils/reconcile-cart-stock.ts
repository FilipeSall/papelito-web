import type { CartStockEntry } from "../services/get-cart-stock";
import type { CartItem } from "../types/cart";

export interface CartStockAdjustment {
  productId: string;
  expectedQuantity: number;
  quantity: number;
}

export interface CartStockIssue {
  type: "limited" | "out_of_stock" | "validation_failed";
  message: string;
}

export interface CartStockReconciliation {
  adjustments: CartStockAdjustment[];
  issues: Record<string, CartStockIssue>;
  canContinue: boolean;
}

export function stockLimitMessage(stockQty: number) {
  return stockQty === 1
    ? "Existe apenas 1 unidade deste produto em estoque."
    : `Existem apenas ${stockQty} unidades deste produto em estoque.`;
}

export function reconcileCartStock(
  items: CartItem[],
  products: Record<string, CartStockEntry>,
): CartStockReconciliation {
  const adjustments: CartStockAdjustment[] = [];
  const issues: Record<string, CartStockIssue> = {};

  for (const item of items) {
    const stock = products[item.id];

    if (!stock) {
      issues[item.id] = {
        type: "validation_failed",
        message: "Nao foi possivel validar o estoque deste produto.",
      };
      continue;
    }

    if (!stock.available || stock.stockQty <= 0) {
      issues[item.id] = {
        type: "out_of_stock",
        message: "Este produto esta sem estoque no momento.",
      };
      continue;
    }

    if (item.quantity > stock.stockQty) {
      adjustments.push({
        productId: item.id,
        expectedQuantity: item.quantity,
        quantity: stock.stockQty,
      });
      issues[item.id] = {
        type: "limited",
        message: stockLimitMessage(stock.stockQty),
      };
    }
  }

  return {
    adjustments,
    issues,
    canContinue: Object.keys(issues).length === 0,
  };
}
