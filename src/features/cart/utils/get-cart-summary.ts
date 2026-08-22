import type {
  CartCoupon,
  CartItem,
  CartPricingQuote,
  CartSummary,
  CartVendorGroup,
} from "../types/cart";

export const CART_SHIPPING_COST = 8.9;

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function getVendorGroups(items: CartItem[]): CartVendorGroup[] {
  const groups = new Map<number, CartVendorGroup>();

  for (const item of items) {
    const existing = groups.get(item.vendorId);

    if (existing) {
      existing.items.push(item);
      existing.subtotal = roundMoney(existing.subtotal + item.price * item.quantity);
      existing.totalItems += item.quantity;
      continue;
    }

    groups.set(item.vendorId, {
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      city: item.city,
      state: item.state,
      distanceKm: item.distanceKm,
      leadTimeDays: item.leadTimeDays,
      items: [item],
      subtotal: roundMoney(item.price * item.quantity),
      totalItems: item.quantity,
    });
  }

  return Array.from(groups.values());
}

export function getCartSummary(
  items: CartItem[],
  coupon: CartCoupon | null,
  shippingOverride?: number | null,
  pricing?: CartPricingQuote | null,
  freeShippingMinimumCents?: number | null,
): CartSummary {
  // Contrato de `CartItem`, escrito por `applyPricingQuote`: `price` é o unitário JÁ com todos os
  // descontos e `originalPrice` é o de tabela. Enquanto nenhuma cotação chegou os dois são iguais.
  const listSubtotal = roundMoney(
    items.reduce((acc, item) => acc + (item.originalPrice ?? item.price) * item.quantity, 0),
  );
  const netSubtotal = roundMoney(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );
  // Desconto que já está embutido nos preços das linhas. Somar o cupom por cima disso descontava
  // duas vezes e mostrava um total menor do que o efetivamente cobrado no checkout.
  const embeddedDiscount = roundMoney(Math.max(0, listSubtotal - netSubtotal));

  const subtotal = pricing ? roundMoney(pricing.totals.subtotalCents / 100) : listSubtotal;
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const discount = pricing
    ? roundMoney(pricing.totals.discountCents / 100)
    : embeddedDiscount > 0
      ? embeddedDiscount
      : coupon
        ? roundMoney(Math.min(coupon.discountValue, subtotal))
        : 0;

  const hasItems = subtotal > 0;
  const validFreeShippingMinimumCents =
    typeof freeShippingMinimumCents === "number" &&
    Number.isSafeInteger(freeShippingMinimumCents) &&
    freeShippingMinimumCents > 0
      ? freeShippingMinimumCents
      : null;
  const subtotalCents = Math.round(subtotal * 100);
  const isFreeShippingCouponEligible =
    hasItems &&
    validFreeShippingMinimumCents !== null &&
    subtotalCents >= validFreeShippingMinimumCents;
  const quotedShipping =
    typeof shippingOverride === "number" && Number.isFinite(shippingOverride)
      ? Math.max(0, shippingOverride)
      : null;
  const shipping = pricing && quotedShipping !== null
    ? pricing.totals.shippingCents / 100
    : quotedShipping !== null
      ? quotedShipping
      : hasItems
        ? CART_SHIPPING_COST
        : 0;
  const amountToFreeShippingCoupon =
    validFreeShippingMinimumCents === null
      ? null
      : roundMoney(Math.max(0, validFreeShippingMinimumCents - subtotalCents) / 100);

  const itemsTotal = pricing
    ? roundMoney(pricing.totals.itemsCents / 100)
    : roundMoney(Math.max(0, subtotal - discount));
  const total = roundMoney(itemsTotal + shipping);

  return {
    subtotal,
    shipping: roundMoney(shipping),
    discount,
    total,
    totalItems,
    vendorGroups: getVendorGroups(items),
    amountToFreeShippingCoupon,
    isFreeShippingCouponEligible,
    coupon,
  };
}
