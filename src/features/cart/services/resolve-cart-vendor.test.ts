import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { buildCartItem } from "../../../../test/factories/cart";
import { server } from "../../../../test/msw/server";
import { resolveCartVendor } from "./resolve-cart-vendor";

describe("resolveCartVendor", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("returns the resolved vendor on success", async () => {
    await expect(
      resolveCartVendor({
        product: { id: "1", quantity: 1 },
        currentItems: [buildCartItem()],
      }),
    ).resolves.toEqual({
      status: "ok",
      vendor: {
        vendorId: 101,
        vendorName: "Vendor Centro",
        city: "Sao Paulo",
        state: "SP",
        distanceKm: 12,
        leadTimeDays: 2,
      },
    });
  });

  it("maps 401 to the login-required message", async () => {
    await expect(
      resolveCartVendor({
        product: { id: "401", quantity: 1 },
        currentItems: [],
      }),
    ).resolves.toEqual({
      status: "unavailable",
      message: "Entre na sua conta para adicionar produtos ao carrinho.",
    });
  });

  it("falls back to unavailable when payload is invalid", async () => {
    server.use(
      http.post("/api/cart/resolve-vendor", () => HttpResponse.json({ status: "ok" })),
    );

    await expect(
      resolveCartVendor({
        product: { id: "1", quantity: 1 },
        currentItems: [],
      }),
    ).resolves.toEqual({
      status: "unavailable",
      message: "Não foi possível validar a disponibilidade por CEP agora.",
    });
  });
});
