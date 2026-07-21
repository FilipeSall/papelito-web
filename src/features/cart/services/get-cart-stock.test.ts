import { describe, expect, it } from "vitest";

import { getCartStock } from "./get-cart-stock";

describe("getCartStock", () => {
  it("returns the current stock for every requested product", async () => {
    await expect(
      getCartStock([
        { productId: 1, vendorId: 101 },
        { productId: 2, vendorId: 101 },
      ]),
    ).resolves.toEqual({
      status: "ok",
      products: {
        "1": { available: true, stockQty: 3 },
        "2": { available: false, stockQty: 0 },
      },
    });
  });
});
