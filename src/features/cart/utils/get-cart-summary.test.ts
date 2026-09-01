import { describe, expect, it } from "vitest";

import { buildCartCoupon, buildCartItem } from "../../../../test/factories/cart";
import type { CartPricingQuote } from "../types/cart";
import { getCartSummary } from "./get-cart-summary";

function roundTo(value: number) {
  return Number(value.toFixed(2));
}

function buildPricingQuote(totals: {
  subtotalCents: number;
  itemsCents: number;
  shippingCents: number;
  shippingDiscountCents: number;
  totalCents: number;
}): CartPricingQuote {
  return {
    lines: [
      {
        productId: 1,
        vendorId: 10,
        qty: 1,
        normalUnitCents: totals.subtotalCents,
        subtotalCents: totals.subtotalCents,
        discountCents: 0,
        totalCents: totals.itemsCents,
        discountSource: "none",
        promotionContext: "",
      },
    ],
    coupon: null,
    adjustments: [],
    totals: { ...totals, discountCents: 0 },
    paymentRestrictions: {
      creditCardMinimumCents: 0,
      pixMinimumCents: 0,
      boletoMinimumCents: 0,
      installmentMinimumCents: 0,
      maxInstallments: 12,
    },
  };
}

describe("getCartSummary", () => {
  it("marks the cart eligible for a free-shipping coupon without changing the freight", () => {
    const items = [
      buildCartItem({ id: "1", quantity: 1, price: 49.5, originalPrice: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "2", quantity: 1, price: 49.5, originalPrice: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "3", quantity: 2, price: 10, originalPrice: 10, vendorId: 20, vendorName: "B" }),
    ];

    const summary = getCartSummary(items, null, null, null, 9900);

    expect(summary.subtotal).toBe(119);
    expect(summary.shipping).toBeNull();
    expect(summary.isFreeShippingCouponEligible).toBe(true);
    expect(summary.amountToFreeShippingCoupon).toBe(0);
    expect(summary.vendorGroups).toHaveLength(2);
    expect(summary.vendorGroups[0]).toMatchObject({
      vendorId: 10,
      subtotal: 99,
      totalItems: 2,
    });
    expect(summary.vendorGroups[1]).toMatchObject({
      vendorId: 20,
      subtotal: 20,
      totalItems: 2,
    });
  });

  it("caps discount at subtotal and calculates the amount still needed for coupon eligibility", () => {
    const items = [buildCartItem({ quantity: 1, price: 30, originalPrice: 30 })];
    const coupon = buildCartCoupon({ discountValue: 1000 });

    const summary = getCartSummary(items, coupon, null, null, 9900);

    expect(summary.subtotal).toBe(30);
    expect(summary.discount).toBe(30);
    expect(summary.shipping).toBeNull();
    expect(summary.total).toBe(0);
    expect(summary.isFreeShippingCouponEligible).toBe(false);
    expect(summary.amountToFreeShippingCoupon).toBe(69);
  });

  it("never subtracts the coupon twice when the line price already carries the discount", () => {
    // Depois que uma cotação chega, `price` passa a ser o preço unitário JÁ com desconto e
    // `originalPrice` guarda o de tabela. Uma reaplicação do cupom limpa `pricing` e cai neste
    // caminho — subtrair o cupom de novo mostrava um total menor que o realmente cobrado.
    const items = [
      buildCartItem({ quantity: 1, price: 83.7, originalPrice: 93 }),
    ];
    const coupon = buildCartCoupon({ discountValue: 9.3 });

    const summary = getCartSummary(items, coupon, null, null, 9900);

    expect(summary.subtotal).toBe(93);
    expect(summary.discount).toBe(9.3);
    expect(summary.total).toBe(roundTo(93 - 9.3));
  });

  it("still applies the coupon while the authoritative quote has not arrived yet", () => {
    const items = [buildCartItem({ quantity: 2, price: 50, originalPrice: 50 })];
    const coupon = buildCartCoupon({ discountValue: 10 });

    const summary = getCartSummary(items, coupon, null, null, 9900);

    expect(summary.subtotal).toBe(100);
    expect(summary.discount).toBe(10);
    expect(summary.total).toBe(90);
  });

  it("uses shipping override when provided and clamps negative values", () => {
    const items = [buildCartItem({ quantity: 2, price: 20 })];

    expect(getCartSummary(items, null, 14.25).shipping).toBe(14.25);
    expect(getCartSummary(items, null, -5).shipping).toBe(0);
  });

  it("never invents a shipping cost before a delivery option is chosen", () => {
    const items = [buildCartItem({ quantity: 1, price: 121, originalPrice: 121 })];

    const summary = getCartSummary(items, null, null, null, 9900);

    expect(summary.subtotal).toBe(121);
    expect(summary.shipping).toBeNull();
    expect(summary.shippingDiscount).toBe(0);
    expect(summary.isFreeShippingApplied).toBe(false);
    expect(summary.total).toBe(121);
  });

  it("ignores shipping from a stale checkout quote when the cart has no shipping selection", () => {
    const items = [buildCartItem({ id: "1", quantity: 1, price: 121, originalPrice: 121 })];
    const staleCheckoutQuote = buildPricingQuote({
      subtotalCents: 12100,
      itemsCents: 12100,
      shippingCents: 1627,
      shippingDiscountCents: 0,
      totalCents: 13727,
    });

    const summary = getCartSummary(items, null, null, staleCheckoutQuote, 9900);

    expect(summary.shipping).toBeNull();
    expect(summary.total).toBe(121);
  });

  it("adds the chosen shipping option to the total", () => {
    const items = [buildCartItem({ quantity: 1, price: 121, originalPrice: 121 })];

    expect(getCartSummary(items, null, 16.27, null, 9900).total).toBe(137.27);
    expect(getCartSummary(items, null, 10.36, null, 9900).total).toBe(131.36);
  });

  it("removes the chosen shipping from the total when the quote grants free shipping", () => {
    const items = [buildCartItem({ id: "1", quantity: 1, price: 121, originalPrice: 121 })];
    const quote = buildPricingQuote({
      subtotalCents: 12100,
      itemsCents: 12100,
      shippingCents: 1627,
      shippingDiscountCents: 1627,
      totalCents: 12100,
    });

    const summary = getCartSummary(items, null, 16.27, quote, 9900);

    expect(summary.shipping).toBe(16.27);
    expect(summary.shippingDiscount).toBe(16.27);
    expect(summary.isFreeShippingApplied).toBe(true);
    expect(summary.total).toBe(121);
  });

  it("keeps charging shipping when the quote did not grant the benefit", () => {
    const items = [buildCartItem({ id: "1", quantity: 1, price: 121, originalPrice: 121 })];
    const quote = buildPricingQuote({
      subtotalCents: 12100,
      itemsCents: 12100,
      shippingCents: 1627,
      shippingDiscountCents: 0,
      totalCents: 13727,
    });

    const summary = getCartSummary(items, null, 16.27, quote, 9900);

    expect(summary.isFreeShippingApplied).toBe(false);
    expect(summary.total).toBe(137.27);
  });

  it("uses the configured threshold at the cent boundary", () => {
    const below = getCartSummary([buildCartItem({ price: 98.99, originalPrice: 98.99 })], null, null, null, 9900);
    const atThreshold = getCartSummary([buildCartItem({ price: 99, originalPrice: 99 })], null, null, null, 9900);

    expect(below.isFreeShippingCouponEligible).toBe(false);
    expect(below.amountToFreeShippingCoupon).toBe(0.01);
    expect(atThreshold.isFreeShippingCouponEligible).toBe(true);
    expect(atThreshold.amountToFreeShippingCoupon).toBe(0);
  });
});
