import { isCepWithinRanges, type ZipRange } from "@/features/shipping/utils/zip-ranges";

import type {
  CartCoupon,
  CartItem,
  CartPricingQuote,
  CartSummary,
  CartVendorGroup,
} from "../types/cart";

export type FreeShippingRegion = {
  destinationCep: string | null;
  zipRanges: readonly ZipRange[];
};

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
  freeShippingRegion?: FreeShippingRegion | null,
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
  // A restrição regional entra na promessa, não só no total: sem isto o carrinho anunciava frete
  // grátis e o cálculo autoritativo cobrava o frete depois da cotação.
  const regionAllowsFreeShipping = isCepWithinRanges(
    freeShippingRegion?.destinationCep,
    freeShippingRegion?.zipRanges ?? [],
  );
  const isFreeShippingCouponEligible =
    hasItems &&
    validFreeShippingMinimumCents !== null &&
    subtotalCents >= validFreeShippingMinimumCents &&
    regionAllowsFreeShipping;
  // Frete só entra no total quando o comprador escolheu uma modalidade válida.
  // Sem escolha o valor é desconhecido — `null` — e não há total definitivo.
  const quotedShipping =
    typeof shippingOverride === "number" && Number.isFinite(shippingOverride)
      ? Math.max(0, shippingOverride)
      : null;
  const shipping =
    quotedShipping === null
      ? null
      : pricing
        ? roundMoney(pricing.totals.shippingCents / 100)
        : roundMoney(quotedShipping);
  const shippingDiscount =
    shipping === null
      ? 0
      : pricing
        ? roundMoney(Math.min(shipping, pricing.totals.shippingDiscountCents / 100))
        : 0;
  const isFreeShippingApplied = shipping !== null && shippingDiscount > 0 && shippingDiscount >= shipping;
  const amountToFreeShippingCoupon =
    validFreeShippingMinimumCents === null || !regionAllowsFreeShipping
      ? null
      : roundMoney(Math.max(0, validFreeShippingMinimumCents - subtotalCents) / 100);

  const itemsTotal = pricing
    ? roundMoney(pricing.totals.itemsCents / 100)
    : roundMoney(Math.max(0, subtotal - discount));
  const total = pricing
    ? roundMoney(
        (shipping === null
          ? pricing.totals.itemsCents
          : pricing.totals.totalCents) / 100,
      )
    : roundMoney(itemsTotal + (shipping ?? 0) - shippingDiscount);

  return {
    subtotal,
    shipping,
    shippingDiscount,
    isFreeShippingApplied,
    discount,
    total,
    totalItems,
    vendorGroups: getVendorGroups(items),
    amountToFreeShippingCoupon,
    isFreeShippingCouponEligible,
    coupon,
  };
}
