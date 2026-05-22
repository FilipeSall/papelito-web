import type { CartItem, CartSummary, CartVendorGroup } from "../types/cart";

export const CART_SHIPPING_THRESHOLD = 99;
export const CART_SHIPPING_COST = 8.9;
export const CART_COUPON_CODE = "PAPELITO10";
export const CART_COUPON_PERCENT = 10;

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
  couponCode: string | null,
  shippingOverride?: number | null,
): CartSummary {
  const subtotal = roundMoney(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const normalizedCoupon = couponCode?.trim().toUpperCase() ?? null;
  const couponApplied =
    normalizedCoupon === CART_COUPON_CODE ? normalizedCoupon : null;
  const discountPercent = couponApplied ? CART_COUPON_PERCENT : 0;
  const discount = roundMoney((subtotal * discountPercent) / 100);

  const hasItems = subtotal > 0;
  const hasFreeShipping = hasItems && subtotal >= CART_SHIPPING_THRESHOLD;
  const quotedShipping =
    typeof shippingOverride === "number" && Number.isFinite(shippingOverride)
      ? Math.max(0, shippingOverride)
      : null;
  const shipping =
    quotedShipping !== null
      ? quotedShipping
      : hasItems && !hasFreeShipping
        ? CART_SHIPPING_COST
        : 0;
  const amountToFreeShipping = hasFreeShipping
    ? 0
    : roundMoney(Math.max(0, CART_SHIPPING_THRESHOLD - subtotal));

  const total = roundMoney(Math.max(0, subtotal - discount) + shipping);

  return {
    subtotal,
    shipping: roundMoney(shipping),
    discount,
    total,
    totalItems,
    vendorGroups: getVendorGroups(items),
    amountToFreeShipping,
    hasFreeShipping,
    couponCode: couponApplied,
  };
}
