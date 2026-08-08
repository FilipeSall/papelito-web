import { describe, expect, it } from "vitest";

import { buildCartCoupon, buildCartItem } from "../../../../test/factories/cart";
import {
  CART_SHIPPING_COST,
  getCartSummary,
} from "./get-cart-summary";

describe("getCartSummary", () => {
  it("marks the cart eligible for a free-shipping coupon without changing the freight", () => {
    const items = [
      buildCartItem({ id: "1", quantity: 1, price: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "2", quantity: 1, price: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "3", quantity: 2, price: 10, vendorId: 20, vendorName: "B" }),
    ];

    const summary = getCartSummary(items, null, null, null, 9900);

    expect(summary.subtotal).toBe(119);
    expect(summary.shipping).toBe(CART_SHIPPING_COST);
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
    const items = [buildCartItem({ quantity: 1, price: 30 })];
    const coupon = buildCartCoupon({ discountValue: 1000 });

    const summary = getCartSummary(items, coupon, null, null, 9900);

    expect(summary.subtotal).toBe(30);
    expect(summary.discount).toBe(30);
    expect(summary.shipping).toBe(CART_SHIPPING_COST);
    expect(summary.total).toBe(CART_SHIPPING_COST);
    expect(summary.isFreeShippingCouponEligible).toBe(false);
    expect(summary.amountToFreeShippingCoupon).toBe(69);
  });

  it("uses shipping override when provided and clamps negative values", () => {
    const items = [buildCartItem({ quantity: 2, price: 20 })];

    expect(getCartSummary(items, null, 14.25).shipping).toBe(14.25);
    expect(getCartSummary(items, null, -5).shipping).toBe(0);
  });

  it("uses the configured threshold at the cent boundary", () => {
    const below = getCartSummary([buildCartItem({ price: 98.99 })], null, null, null, 9900);
    const atThreshold = getCartSummary([buildCartItem({ price: 99 })], null, null, null, 9900);

    expect(below.isFreeShippingCouponEligible).toBe(false);
    expect(below.amountToFreeShippingCoupon).toBe(0.01);
    expect(atThreshold.isFreeShippingCouponEligible).toBe(true);
    expect(atThreshold.amountToFreeShippingCoupon).toBe(0);
  });
});
