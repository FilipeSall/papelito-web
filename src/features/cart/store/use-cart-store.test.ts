import { describe, expect, it } from "vitest";

import { buildResolvedCartProduct } from "../../../../test/factories/cart";
import type { CartPricingQuote } from "../types/cart";
import { getCartSummary } from "../utils/get-cart-summary";
import { useCartStore } from "./use-cart-store";

describe("useCartStore", () => {
  it("adds quantity to an existing item", () => {
    const product = buildResolvedCartProduct({ id: "1" });

    useCartStore.getState().addItem(product, 1);
    useCartStore.getState().addItem(product, 2);

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        id: "1",
        quantity: 3,
      }),
    ]);
  });

  it("removes an item when its quantity is decreased from one", () => {
    const product = buildResolvedCartProduct({ id: "1" });

    useCartStore.getState().addItem(product, 1);
    useCartStore.getState().decreaseItem("1");

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("only applies a validated quantity when the current quantity did not change", () => {
    const product = buildResolvedCartProduct({ id: "1" });

    useCartStore.getState().addItem(product, 2);

    expect(
      useCartStore.getState().setItemQuantityIfCurrent("1", 2, 3),
    ).toBe(true);
    expect(
      useCartStore.getState().setItemQuantityIfCurrent("1", 2, 4),
    ).toBe(false);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("normalizes persisted state on rehydrate", async () => {
    window.localStorage.setItem(
      "papelito-cart-store",
      JSON.stringify({
        state: {
          items: [
            {
              id: "1",
              name: "Produto",
              price: "29.9",
              quantity: "2",
              vendorId: "101",
              vendorName: "Vendor Centro",
            },
            {
              id: "",
              quantity: 1,
            },
          ],
          coupon: {
            code: "cupom10",
            discountValue: "10",
            discountType: "fixed_cart",
            appliedProductIds: ["1", 2],
          },
        },
        version: 2,
      }),
    );

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({
        id: "1",
        quantity: 2,
        price: 29.9,
        vendorId: 101,
        vendorName: "Vendor Centro",
      }),
    ]);
    expect(useCartStore.getState().coupon).toEqual({
      code: "CUPOM10",
      discountValue: 10,
      discountType: "fixed_cart",
      appliedProductIds: [1, 2],
    });
  });

  it("removes a legacy coupon discount from persisted line prices", async () => {
    window.localStorage.setItem(
      "papelito-cart-store",
      JSON.stringify({
        state: {
          items: [{
            id: "1",
            name: "Produto",
            originalPrice: 93,
            price: 83.7,
            quantity: 1,
            vendorId: 101,
            vendorName: "Vendor Centro",
          }],
          coupon: {
            code: "dez",
            discountValue: 9.3,
            discountType: "percent",
            appliedProductIds: [1],
          },
        },
        version: 4,
      }),
    );

    await useCartStore.persist.rehydrate();

    expect(useCartStore.getState().items[0]).toMatchObject({
      price: 93,
      pricingDiscountSource: "none",
    });
  });

  it("restores a coupon-discounted line when the coupon is removed", () => {
    const product = buildResolvedCartProduct({ id: "1", price: 93, originalPrice: 93 });
    const quote: CartPricingQuote = {
      lines: [{
        productId: 1,
        vendorId: product.vendorId,
        qty: 1,
        normalUnitCents: 9300,
        subtotalCents: 9300,
        discountCents: 930,
        totalCents: 8370,
        discountSource: "coupon",
        promotionContext: "",
      }],
      coupon: {
        code: "DEZ",
        discountType: "percent",
        discountValueCents: 930,
        appliedProductIds: [1],
        applied: true,
      },
      adjustments: [],
      totals: {
        subtotalCents: 9300,
        discountCents: 930,
        itemsCents: 8370,
        shippingCents: 0,
        totalCents: 8370,
      },
      paymentRestrictions: {
        creditCardMinimumCents: 100,
        pixMinimumCents: 1,
        boletoMinimumCents: 1,
        installmentMinimumCents: 100,
        maxInstallments: 6,
      },
    };

    useCartStore.setState({
      coupon: null,
      items: [{ ...product, quantity: 1 }],
      pricing: null,
      pricingError: null,
      pricingRequiresConfirmation: false,
    });
    useCartStore.getState().applyPricingQuote(quote);
    useCartStore.getState().removeCoupon();

    const { items, coupon, pricing } = useCartStore.getState();
    const summary = getCartSummary(items, coupon, null, pricing);

    expect(items[0]?.price).toBe(93);
    expect(summary.discount).toBe(0);
    expect(summary.total).toBe(101.9);
  });

  it("keeps a flash-sale price when a coupon is removed", () => {
    const product = buildResolvedCartProduct({ id: "1", price: 93, originalPrice: 93 });
    const quote: CartPricingQuote = {
      lines: [{
        productId: 1,
        vendorId: product.vendorId,
        qty: 1,
        normalUnitCents: 9300,
        subtotalCents: 9300,
        discountCents: 930,
        totalCents: 8370,
        discountSource: "flash_sale",
        promotionContext: "signed-context",
      }],
      coupon: null,
      adjustments: [],
      totals: {
        subtotalCents: 9300,
        discountCents: 930,
        itemsCents: 8370,
        shippingCents: 0,
        totalCents: 8370,
      },
      paymentRestrictions: {
        creditCardMinimumCents: 100,
        pixMinimumCents: 1,
        boletoMinimumCents: 1,
        installmentMinimumCents: 100,
        maxInstallments: 6,
      },
    };

    useCartStore.setState({
      coupon: null,
      items: [{ ...product, quantity: 1 }],
      pricing: null,
      pricingError: null,
      pricingRequiresConfirmation: false,
    });
    useCartStore.getState().applyPricingQuote(quote);
    useCartStore.getState().removeCoupon();

    expect(useCartStore.getState().items[0]).toMatchObject({
      price: 83.7,
      pricingDiscountSource: "flash_sale",
    });
  });
});
