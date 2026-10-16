import { describe, expect, it } from "vitest";

import { resolveCheckoutOutcome } from "./resolve-checkout-outcome";

describe("resolveCheckoutOutcome", () => {
  it("confirms (clears cart) when a credit card is approved", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 1, payment: { method: "credit_card", state: "paid" } }),
    ).toEqual({ kind: "confirmed", orderId: 1 });
  });

  it("errors (keeps cart) when a credit card is refused", () => {
    const outcome = resolveCheckoutOutcome({
      orderId: 1,
      payment: { method: "credit_card", state: "refused" },
    });
    expect(outcome.kind).toBe("error");
  });

  it("continues to the pending payment page for an unconfirmed PIX charge", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 11879, payment: { method: "pix", state: "waiting_payment" } }),
    ).toEqual({ kind: "pending", orderId: 11879 });
  });

  it("continues to the pending payment page for an unconfirmed boleto", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 7, payment: { method: "boleto", state: "pending" } }),
    ).toEqual({ kind: "pending", orderId: 7 });
  });

  it("stays pending when a PIX/boleto charge has no state yet", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 7, payment: { method: "pix" } }),
    ).toEqual({ kind: "pending", orderId: 7 });
  });

  it("confirms a PIX/boleto only once the charge is actually paid", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 7, payment: { method: "pix", state: "paid" } }),
    ).toEqual({ kind: "confirmed", orderId: 7 });
    expect(
      resolveCheckoutOutcome({ orderId: 8, payment: { method: "boleto", state: "captured" } }),
    ).toEqual({ kind: "confirmed", orderId: 8 });
  });
});

describe("resolveCheckoutOutcome com gateways", () => {
  const MP_URL = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc";

  it("redireciona ao Checkout Pro quando a preferência está pendente", () => {
    expect(
      resolveCheckoutOutcome({
        orderId: 9,
        payment: { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 3, redirectUrl: MP_URL },
      }),
    ).toEqual({ kind: "redirect", orderId: 9, redirectUrl: MP_URL });
  });

  it("pendente no redirect não é cartão recusado, mesmo com método de cartão", () => {
    const outcome = resolveCheckoutOutcome({
      orderId: 9,
      payment: { method: "credit_card", state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 3, redirectUrl: MP_URL },
    });

    expect(outcome.kind).toBe("redirect");
  });

  it("redirect sem URL permitida nunca sai do site nem confirma", () => {
    expect(
      resolveCheckoutOutcome({
        orderId: 9,
        payment: { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 3, redirectUrl: "https://evil.example/pay" },
      }),
    ).toEqual({ kind: "pending", orderId: 9 });
  });

  it("redirect já pago pelo servidor confirma", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 9, payment: { state: "paid", provider: "mercadopago", flow: "redirect", paymentAttemptId: 3 } }),
    ).toEqual({ kind: "confirmed", orderId: 9 });
  });

  it("pede a coleta Pagar.me na mesma tentativa", () => {
    expect(
      resolveCheckoutOutcome({
        orderId: 9,
        payment: { method: "", state: "awaiting_payment_input", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31, configurationVersion: "cfg-2" },
      }),
    ).toEqual({ kind: "requires_payment_input", orderId: 9, paymentAttemptId: 31, configurationVersion: "cfg-2" });
  });

  it("tentativa de coleta já cobrada segue as regras da cobrança direta", () => {
    expect(
      resolveCheckoutOutcome({
        orderId: 9,
        payment: { method: "pix", state: "pending", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 },
      }),
    ).toEqual({ kind: "pending", orderId: 9 });
    expect(
      resolveCheckoutOutcome({
        orderId: 9,
        payment: { method: "credit_card", state: "failed", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 31 },
      }).kind,
    ).toBe("error");
  });

  it("fluxo direto novo mantém a regra legada do cartão", () => {
    expect(
      resolveCheckoutOutcome({ orderId: 9, payment: { method: "credit_card", state: "failed", provider: "pagarme", flow: "direct", paymentAttemptId: 4 } }).kind,
    ).toBe("error");
    expect(
      resolveCheckoutOutcome({ orderId: 9, payment: { method: "credit_card", state: "paid", provider: "pagarme", flow: "direct", paymentAttemptId: 4 } }),
    ).toEqual({ kind: "confirmed", orderId: 9 });
  });
});
