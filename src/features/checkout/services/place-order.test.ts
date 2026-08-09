import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { placeOrder } from "./place-order";

type PlaceOrderRequestPayload = {
  checkout_attempt_id?: string;
	expected_company_id?: number;
};

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
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;

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

    expect(payload).toMatchObject({
      checkout_attempt_id: "attempt-123",
    });
  });

  it("sends expectedCompanyId only when the B2B checkout supplies it", async () => {
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;
        return HttpResponse.json({ orderId: 321, orderNumber: "321", status: "pending", payment: { method: "pix", state: "waiting_payment" } });
      }),
    );
    await placeOrder({ ...baseInput, expectedCompanyId: 44 });
    expect(payload).toMatchObject({ expected_company_id: 44 });
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
        message: "O vendor selecionado não esta apto para receber pedidos.",
        status: 422,
      },
    });
  });

  it("does not show a hardcoded installment floor when the backend omits its message", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json({ code: "papelito_checkout_installment_below_minimum" }, { status: 422 }),
      ),
    );

    await expect(placeOrder(baseInput)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "papelito_checkout_installment_below_minimum",
        message: "Reduza as parcelas; o valor mínimo configurado por parcela não foi atingido.",
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
        message: "Resposta inválida ao concluir o pedido.",
        status: 200,
      },
    });
  });
});
