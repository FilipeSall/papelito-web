import { describe, expect, it } from "vitest";

import { buildResolvedCartProduct } from "../../../../test/factories/cart";
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
});
