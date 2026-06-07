import { describe, expect, it } from "vitest";

import { buildCartCoupon, buildCartItem } from "../../../../test/factories/cart";
import {
  CART_SHIPPING_COST,
  CART_SHIPPING_THRESHOLD,
  getCartSummary,
} from "./get-cart-summary";

describe("getCartSummary", () => {
  it("applies free shipping at the threshold and groups items by vendor", () => {
    const items = [
      buildCartItem({ id: "1", quantity: 1, price: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "2", quantity: 1, price: 49.5, vendorId: 10, vendorName: "A" }),
      buildCartItem({ id: "3", quantity: 2, price: 10, vendorId: 20, vendorName: "B" }),
    ];

    const summary = getCartSummary(items, null);

    expect(summary.subtotal).toBe(119);
    expect(summary.shipping).toBe(0);
    expect(summary.hasFreeShipping).toBe(true);
    expect(summary.amountToFreeShipping).toBe(0);
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

  it("caps discount at subtotal and charges standard shipping below the threshold", () => {
    const items = [buildCartItem({ quantity: 1, price: 30 })];
    const coupon = buildCartCoupon({ discountValue: 1000 });

    const summary = getCartSummary(items, coupon);

    expect(summary.subtotal).toBe(30);
    expect(summary.discount).toBe(30);
    expect(summary.shipping).toBe(CART_SHIPPING_COST);
    expect(summary.total).toBe(CART_SHIPPING_COST);
    expect(summary.amountToFreeShipping).toBe(CART_SHIPPING_THRESHOLD - 30);
  });

  it("uses shipping override when provided and clamps negative values", () => {
    const items = [buildCartItem({ quantity: 2, price: 20 })];

    expect(getCartSummary(items, null, 14.25).shipping).toBe(14.25);
    expect(getCartSummary(items, null, -5).shipping).toBe(0);
  });
});
