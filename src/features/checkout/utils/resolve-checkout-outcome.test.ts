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
