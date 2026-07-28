import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { applyCouponClient } from "./apply-coupon";

describe("applyCouponClient", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("returns the normalized success payload", async () => {
    const result = await applyCouponClient("papelito10", [
      { productId: 1, vendorId: 10, qty: 2, price: 29.9 },
    ]);

    expect(result).toEqual({
      ok: true,
      code: "PAPELITO10",
      discountType: "fixed_cart",
      discountValue: 10,
      appliedProductIds: [1],
    });
  });

  it("maps known error codes to friendly messages", async () => {
    const result = await applyCouponClient("EXPIRADO", []);

    expect(result).toEqual({
      ok: false,
      status: 422,
      errorCode: "papelito_coupon_expired",
      message: "Este cupom expirou.",
    });
  });

  it("handles invalid json payloads", async () => {
    const result = await applyCouponClient("INVALID-JSON", []);

    expect(result).toEqual({
      ok: false,
      status: 200,
      errorCode: "papelito_invalid_response",
      message: "Resposta inválida ao aplicar cupom.",
    });
  });

  it("handles network failures", async () => {
    server.use(
      http.post("/api/coupons/apply", () => HttpResponse.error()),
    );

    const result = await applyCouponClient("PAPELITO10", []);

    expect(result).toEqual({
      ok: false,
      status: 0,
      errorCode: "papelito_network_error",
      message: "Falha de rede ao aplicar cupom.",
    });
  });
});
