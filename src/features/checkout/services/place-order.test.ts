import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { placeOrder } from "./place-order";

const baseInput = {
  checkoutAttemptId: "attempt-123",
  items: [{ productId: 1, qty: 2, vendorId: 10, vendorName: "Vendor Centro" }],
  address: {
    zipCode: "01310-930",
    street: "Rua A",
    number: "10",
    complement: "",
    neighborhood: "Centro",
    city: "Sao Paulo",
    state: "SP",
  },
  shipping: {
    selectedCode: "sedex",
    destinationCep: "01310930",
  },
  payment: {
    method: "pix" as const,
  },
};

describe("placeOrder", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("returns a successful order payload", async () => {
    await expect(placeOrder(baseInput)).resolves.toEqual({
      ok: true,
      result: {
        orderId: 321,
        orderNumber: "321",
        status: "processing",
        payment: {
          method: "credit_card",
          state: "paid",
        },
      },
    });
  });

  it("sends the stable checkout attempt id to the backend", async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          orderId: 321,
          orderNumber: "321",
          status: "pending",
          payment: {
            method: "pix",
            state: "waiting_payment",
          },
        });
      }),
    );

    await placeOrder(baseInput);

    expect(payload?.checkout_attempt_id).toBe("attempt-123");
  });

  it("prefers the backend message over the friendly fallback map", async () => {
    await expect(placeOrder({ ...baseInput, couponCode: "EXPIRADO" })).resolves.toEqual({
      ok: false,
      error: {
        code: "papelito_coupon_expired",
        message: "Expirado.",
        status: 422,
      },
    });
  });

  it("falls back to the friendly map when the backend omits a message", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json({ code: "papelito_checkout_vendor_not_approved" }, { status: 422 }),
      ),
    );

    await expect(placeOrder(baseInput)).resolves.toEqual({
      ok: false,
      error: {
        code: "papelito_checkout_vendor_not_approved",
        message: "O vendor selecionado nao esta apto para receber pedidos.",
        status: 422,
      },
    });
  });

  it("returns invalid response when the success payload is incomplete", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json({ message: "incompleto" }),
      ),
    );

    await expect(placeOrder(baseInput)).resolves.toEqual({
      ok: false,
      error: {
        code: "papelito_invalid_response",
        message: "Resposta invalida ao concluir o pedido.",
        status: 200,
      },
    });
  });
});
