import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../../test/msw/server";
import { continuePaymentAttempt } from "./continue-payment-attempt";

const CONTINUE_URL = "/api/checkout/payment-attempts/31/continue";

const input = {
  paymentAttemptId: 31,
  expectedCompanyId: 10,
  configurationVersion: "cfg-2",
  payment: { method: "credit_card" as const, installments: 2, cardTokenId: "tok_pagarme", holderName: "Ana Lima" },
};

describe("continuePaymentAttempt", () => {
  it("envia empresa, versão e pagamento para a mesma tentativa", async () => {
    let body: unknown = null;
    server.use(
      http.post(CONTINUE_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          order_id: 9,
          order_number: "9",
          status: "processing",
          payment: { method: "credit_card", state: "paid", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31, configurationVersion: "cfg-2" },
        });
      }),
    );

    await expect(continuePaymentAttempt(input)).resolves.toMatchObject({
      ok: true,
      result: { orderId: 9, orderNumber: "9", status: "processing", payment: { method: "credit_card", state: "paid" } },
    });
    expect(body).toEqual({
      expectedCompanyId: 10,
      configurationVersion: "cfg-2",
      payment: { method: "credit_card", installments: 2, card_token_id: "tok_pagarme", holder_name: "Ana Lima" },
    });
  });

  it("configuração obsoleta pede atualização sem cobrar", async () => {
    server.use(
      http.post(CONTINUE_URL, () =>
        HttpResponse.json({ code: "papelito_payment_configuration_stale", message: "" }, { status: 409 }),
      ),
    );

    await expect(continuePaymentAttempt(input)).resolves.toEqual({
      ok: false,
      error: {
        code: "papelito_payment_configuration_stale",
        message: "As condições de pagamento mudaram. Atualize a página antes de pagar.",
        status: 409,
      },
    });
  });

  it("resposta sem pedido não vira sucesso", async () => {
    server.use(http.post(CONTINUE_URL, () => HttpResponse.json({ status: "processing" })));

    await expect(continuePaymentAttempt(input)).resolves.toMatchObject({ ok: false, error: { code: "papelito_invalid_response" } });
  });

  it("falha de rede mantém a tentativa para tentar de novo", async () => {
    server.use(http.post(CONTINUE_URL, () => HttpResponse.error()));

    await expect(continuePaymentAttempt(input)).resolves.toMatchObject({ ok: false, error: { code: "papelito_network_error" } });
  });

  it("configuração obsoleta devolve a versão nova para o comprador confirmar de novo", async () => {
    server.use(
      http.post(CONTINUE_URL, () =>
        HttpResponse.json({ code: "papelito_payment_configuration_stale", message: "", configurationVersion: "cfg-3" }, { status: 409 }),
      ),
    );

    await expect(continuePaymentAttempt(input)).resolves.toMatchObject({
      ok: false,
      error: { code: "papelito_payment_configuration_stale", configurationVersion: "cfg-3" },
    });
  });
});
