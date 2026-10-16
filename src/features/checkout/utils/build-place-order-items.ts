import type { CartItem } from "@/features/cart/types/cart";

import type { PlaceOrderInput } from "../types/checkout";

type PlaceOrderItem = PlaceOrderInput["items"][number];

function toPlaceOrderItem(item: CartItem): PlaceOrderItem | null {
  const productId = Number.parseInt(item.id, 10);

  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  return {
    productId,
    qty: item.quantity,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    promotionContext: item.promotionContext,
  };
}

/**
 * Itens do carrinho no formato do place-order e do payment-context. Item com id que não é um
 * produto numérico some da lista — quem chama compara os tamanhos para bloquear o envio.
 */
export function buildPlaceOrderItems(items: CartItem[]): PlaceOrderItem[] {
  return items.map(toPlaceOrderItem).filter((item): item is PlaceOrderItem => item !== null);
}
