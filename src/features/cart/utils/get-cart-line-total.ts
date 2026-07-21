import type { CartItem, CartPricingQuote } from "../types/cart";

export function getCartLineTotal(
  item: CartItem,
  pricing: CartPricingQuote | null,
): number {
  const productId = Number.parseInt(item.id, 10);
  const authoritativeLine = Number.isInteger(productId)
    ? pricing?.lines.find(
        (line) => line.productId === productId && line.qty === item.quantity,
      )
    : undefined;

  return authoritativeLine
    ? authoritativeLine.totalCents / 100
    : item.price * item.quantity;
}
