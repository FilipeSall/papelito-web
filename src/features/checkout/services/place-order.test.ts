import { afterEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import { placeOrder } from "./place-order";

type PlaceOrderRequestPayload = {
  checkout_attempt_id?: string;
	expected_company_id?: number;
  analytics?: { client_id?: string; session_id?: string };
  shipping?: {
    expected_customer_price_cents?: number;
    expected_delivery_time?: number | null;
    expected_expires_at?: string | null;
    expected_fingerprint?: string;
  };
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
    expectedFingerprint: "shipping-fingerprint",
    expectedCustomerPriceCents: 1937,
    expectedDeliveryTime: 2,
    expectedExpiresAt: null,
    destinationCep: "01310930",
  },
  payment: {
    method: "pix" as const,
  },
};

const validTotals = {
  subtotalCents: 12100,
  discountCents: 0,
  itemsCents: 12100,
  shippingCents: 1937,
  shippingDiscountCents: 1937,
  totalCents: 12100,
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
        totals: validTotals,
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
          totals: validTotals,
        });
      }),
    );

    await placeOrder(baseInput);

    expect(payload).toMatchObject({
      checkout_attempt_id: "attempt-123",
    });
  });

  it("sends the shipping snapshot so the backend can reject a stale quote", async () => {
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;
        return HttpResponse.json({ orderId: 321, orderNumber: "321", status: "pending", payment: { method: "pix", state: "waiting_payment" }, totals: validTotals });
      }),
    );

    await placeOrder(baseInput);

    expect(payload).toMatchObject({
      shipping: {
        expected_customer_price_cents: 1937,
        expected_delivery_time: 2,
        expected_expires_at: null,
        expected_fingerprint: "shipping-fingerprint",
      },
    });
  });

  it("sends expectedCompanyId only when the B2B checkout supplies it", async () => {
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;
        return HttpResponse.json({ orderId: 321, orderNumber: "321", status: "pending", payment: { method: "pix", state: "waiting_payment" }, totals: validTotals });
      }),
    );
    await placeOrder({ ...baseInput, expectedCompanyId: 44 });
    expect(payload).toMatchObject({ expected_company_id: 44 });
  });

  it("sends the GA identifiers so the purchase lands on the campaign session", async () => {
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;
        return HttpResponse.json({ orderId: 321, orderNumber: "321", status: "pending", payment: { method: "pix", state: "waiting_payment" }, totals: validTotals });
      }),
    );

    await placeOrder({
      ...baseInput,
      analytics: { clientId: "1189418253.1777895566", sessionId: "1787849320" },
    });

    expect(payload).toMatchObject({
      analytics: { client_id: "1189418253.1777895566", session_id: "1787849320" },
    });
  });

  /** Sem cookie do GA4 — bloqueador, ou consentimento recusado — o pedido segue sem o bloco. */
  it("omits the analytics block when the browser has no GA identifiers", async () => {
    let payload: PlaceOrderRequestPayload | null = null;
    server.use(
      http.post("/api/checkout/place-order", async ({ request }) => {
        payload = (await request.json()) as PlaceOrderRequestPayload;
        return HttpResponse.json({ orderId: 321, orderNumber: "321", status: "pending", payment: { method: "pix", state: "waiting_payment" }, totals: validTotals });
      }),
    );

    await placeOrder({ ...baseInput, analytics: {} });

    expect(payload).not.toHaveProperty("analytics");
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

  it("rejects checkout totals whose shipping discount increases the order", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json({
          orderId: 321,
          orderNumber: "321",
          status: "pending",
          payment: { method: "pix", state: "waiting_payment" },
          totals: {
            subtotalCents: 12100,
            discountCents: 0,
            itemsCents: 12100,
            shippingCents: 1937,
            shippingDiscountCents: -1937,
            totalCents: 14037,
          },
        }),
      ),
    );

    await expect(placeOrder(baseInput)).resolves.toMatchObject({
      ok: false,
      error: { code: "papelito_invalid_response" },
    });
  });

  describe("gateways de pagamento", () => {
    const MP_URL = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc";
    const mercadoPagoInput = { ...baseInput, payment: undefined };

    function respondWith(payment: Record<string, unknown>) {
      server.use(
        http.post("/api/checkout/place-order", () =>
          HttpResponse.json({ orderId: 77, orderNumber: "77", status: "pending", payment, totals: validTotals }),
        ),
      );
    }

    it("omite o pagamento quando o gateway é o Mercado Pago", async () => {
      let payload: Record<string, unknown> | null = null;
      server.use(
        http.post("/api/checkout/place-order", async ({ request }) => {
          payload = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            orderId: 77,
            orderNumber: "77",
            status: "pending",
            payment: { method: "", state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, configurationVersion: "v1", fallbackReason: "", redirectUrl: MP_URL },
            totals: validTotals,
          });
        }),
      );

      await placeOrder(mercadoPagoInput);

      expect(payload).not.toBeNull();
      expect(payload).not.toHaveProperty("payment");
    });

    it("aceita redirect sem método com URL do Mercado Pago", async () => {
      respondWith({ state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, configurationVersion: "v1", fallbackReason: "", redirectUrl: MP_URL });

      await expect(placeOrder(mercadoPagoInput)).resolves.toMatchObject({
        ok: true,
        result: { orderId: 77, payment: { provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, redirectUrl: MP_URL } },
      });
    });

    it("aceita coleta pendente sem método", async () => {
      respondWith({ method: "", state: "awaiting_payment_input", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 6, configurationVersion: "v2", fallbackReason: "preferred_failed_before_creation" });

      await expect(placeOrder(mercadoPagoInput)).resolves.toMatchObject({
        ok: true,
        result: { payment: { flow: "requires_payment_input", paymentAttemptId: 6, configurationVersion: "v2" } },
      });
    });

    it("aceita cobrança direta nova com método", async () => {
      respondWith({ method: "pix", state: "pending", provider: "pagarme", flow: "direct", paymentAttemptId: 7, configurationVersion: "v3", fallbackReason: "", pix: { qr_code: "000201" } });

      await expect(placeOrder(baseInput)).resolves.toMatchObject({
        ok: true,
        result: { payment: { method: "pix", flow: "direct", pix: { qr_code: "000201" } } },
      });
    });

    it.each([
      ["redirect sem URL", { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5 }],
      ["redirect com HTTP", { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, redirectUrl: "http://www.mercadopago.com.br/x" }],
      ["redirect fora do Mercado Pago", { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, redirectUrl: "https://mercadopago.com.br.evil.com/x" }],
      ["redirect pela Pagar.me", { state: "pending", provider: "pagarme", flow: "redirect", paymentAttemptId: 5, redirectUrl: MP_URL }],
      ["fluxo desconhecido", { state: "paid", provider: "mercadopago", flow: "transparent", paymentAttemptId: 5 }],
      ["gateway desconhecido", { method: "pix", state: "paid", provider: "stripe", flow: "direct", paymentAttemptId: 5 }],
      ["tentativa sem identificador", { state: "awaiting_payment_input", provider: "pagarme", flow: "requires_payment_input", configurationVersion: "v" }],
      ["coleta pelo Mercado Pago", { state: "awaiting_payment_input", provider: "mercadopago", flow: "requires_payment_input", paymentAttemptId: 5, configurationVersion: "v" }],
      ["direto sem método", { state: "paid", provider: "pagarme", flow: "direct", paymentAttemptId: 5 }],
    ])("resposta nova malformada (%s) não vira sucesso", async (_label, payment) => {
      respondWith(payment);

      await expect(placeOrder(mercadoPagoInput)).resolves.toMatchObject({
        ok: false,
        error: { code: "papelito_invalid_response" },
      });
    });

    it("repassa o pedido do erro de reconciliação", async () => {
      server.use(
        http.post("/api/checkout/place-order", () =>
          HttpResponse.json(
            { code: "papelito_payment_attempt_reconciling", message: "Estamos confirmando.", orderId: 88 },
            { status: 409 },
          ),
        ),
      );

      await expect(placeOrder(mercadoPagoInput)).resolves.toEqual({
        ok: false,
        error: { code: "papelito_payment_attempt_reconciling", message: "Estamos confirmando.", status: 409, orderId: 88 },
      });
    });
  });
});
