import { describe, expect, it } from "vitest";

import { buildCartItem } from "../../../../test/factories/cart";
import { reconcileCartStock } from "./reconcile-cart-stock";

describe("reconcileCartStock", () => {
  it("limits an existing quantity to the current positive stock", () => {
    expect(
      reconcileCartStock(
        [buildCartItem({ id: "1", quantity: 5 })],
        { "1": { available: true, stockQty: 3 } },
      ),
    ).toEqual({
      adjustments: [
        { productId: "1", expectedQuantity: 5, quantity: 3 },
      ],
      issues: {
        "1": {
          type: "limited",
          message: "Existem apenas 3 unidades deste produto em estoque.",
        },
      },
      canContinue: false,
    });
  });

  it("reconciles multiple items independently and preserves an out-of-stock line", () => {
    expect(
      reconcileCartStock(
        [
          buildCartItem({ id: "1", quantity: 4 }),
          buildCartItem({ id: "2", quantity: 1 }),
        ],
        {
          "1": { available: true, stockQty: 3 },
          "2": { available: false, stockQty: 0 },
        },
      ),
    ).toEqual({
      adjustments: [
        { productId: "1", expectedQuantity: 4, quantity: 3 },
      ],
      issues: {
        "1": {
          type: "limited",
          message: "Existem apenas 3 unidades deste produto em estoque.",
        },
        "2": {
          type: "out_of_stock",
          message: "Este produto está sem estoque no momento.",
        },
      },
      canContinue: false,
    });
  });
});
