import type {
  CartCoupon,
  CartItem,
  CartPricingQuote,
  CartSummary,
  CartVendorGroup,
} from "../types/cart";

export const CART_SHIPPING_THRESHOLD = 99;
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
): CartSummary {
  const subtotal = pricing
    ? roundMoney(pricing.totals.subtotalCents / 100)
    : roundMoney(items.reduce((acc, item) => acc + item.price * item.quantity, 0));
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const discount = pricing
    ? roundMoney(pricing.totals.discountCents / 100)
    : coupon
      ? roundMoney(Math.min(coupon.discountValue, subtotal))
      : 0;

  const hasItems = subtotal > 0;
  const hasFreeShipping = hasItems && subtotal >= CART_SHIPPING_THRESHOLD;
  const quotedShipping =
    typeof shippingOverride === "number" && Number.isFinite(shippingOverride)
      ? Math.max(0, shippingOverride)
      : null;
  const shipping = pricing && quotedShipping !== null
    ? pricing.totals.shippingCents / 100
    : quotedShipping !== null
      ? quotedShipping
      : hasItems && !hasFreeShipping
        ? CART_SHIPPING_COST
        : 0;
  const amountToFreeShipping = hasFreeShipping
    ? 0
    : roundMoney(Math.max(0, CART_SHIPPING_THRESHOLD - subtotal));

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
    amountToFreeShipping,
    hasFreeShipping,
    coupon,
  };
}
