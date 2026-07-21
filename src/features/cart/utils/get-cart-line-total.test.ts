import { describe, expect, it } from "vitest";
import type { CartItem, CartPricingQuote } from "../types/cart";
import { getCartLineTotal } from "./get-cart-line-total";

const item: CartItem = {
  id: "123",
  name: "Produto",
  price: 1 / 3,
  quantity: 3,
  vendorId: 10,
  vendorName: "Vendor",
};

const pricing: CartPricingQuote = {
  lines: [
    {
      productId: 123,
      vendorId: 10,
      qty: 3,
      normalUnitCents: 34,
      subtotalCents: 102,
      discountCents: 1,
      totalCents: 101,
      discountSource: "coupon",
      promotionContext: "",
    },
  ],
  coupon: null,
  adjustments: [],
  totals: {
    subtotalCents: 102,
    discountCents: 1,
    itemsCents: 101,
    shippingCents: 0,
    totalCents: 101,
  },
  paymentRestrictions: {
    creditCardMinimumCents: 100,
    pixMinimumCents: 1,
    boletoMinimumCents: 1,
    installmentMinimumCents: 100,
    maxInstallments: 6,
  },
};

describe("getCartLineTotal", () => {
  it("uses the authoritative line total without reconstructing cents from a unit float", () => {
    expect(getCartLineTotal(item, pricing)).toBe(1.01);
  });

  it("falls back to the local item total when there is no current quote", () => {
    expect(getCartLineTotal(item, null)).toBeCloseTo(1);
  });
});
