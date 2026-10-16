import type { PlaceOrderPaymentResult } from "../types/checkout";
import { isAllowedMercadoPagoUrl } from "./mercado-pago-redirect";

export type CheckoutOutcome =
  | { kind: "error"; message: string }
  | { kind: "confirmed"; orderId: string | number }
  | { kind: "pending"; orderId: string | number }
  | { kind: "redirect"; orderId: string | number; redirectUrl: string }
  | {
      kind: "requires_payment_input";
      orderId: string | number;
      paymentAttemptId: number;
      configurationVersion: string;
    };

type OutcomeInput = {
  orderId: string | number;
  payment: Partial<PlaceOrderPaymentResult>;
};

const PAID_STATES = new Set(["paid", "captured"]);
const CLOSED_STATES = new Set(["failed", "expired", "refunded"]);
const AWAITING_INPUT_STATE = "awaiting_payment_input";
const CARD_REFUSED_MESSAGE = "Pagamento recusado. Revise os dados ou tente outro método.";
const PAYMENT_CLOSED_MESSAGE = "O pagamento deste pedido não foi concluído. Refaça o pedido para tentar de novo.";

function resolveDirectOutcome({ orderId, payment }: OutcomeInput): CheckoutOutcome {
  const paymentConfirmed = PAID_STATES.has(payment.state ?? "");

  if (payment.method === "credit_card" && !paymentConfirmed) {
    return { kind: "error", message: CARD_REFUSED_MESSAGE };
  }

  if (paymentConfirmed) {
    return { kind: "confirmed", orderId };
  }

  if (payment.flow && CLOSED_STATES.has(payment.state ?? "")) {
    return { kind: "error", message: PAYMENT_CLOSED_MESSAGE };
  }

  return { kind: "pending", orderId };
}

function resolveRedirectOutcome({ orderId, payment }: OutcomeInput): CheckoutOutcome {
  if (PAID_STATES.has(payment.state ?? "")) {
    return { kind: "confirmed", orderId };
  }

  if (payment.state === "pending" && isAllowedMercadoPagoUrl(payment.redirectUrl)) {
    return { kind: "redirect", orderId, redirectUrl: payment.redirectUrl };
  }

  return { kind: "pending", orderId };
}

function resolveRequiresInputOutcome(input: OutcomeInput): CheckoutOutcome {
  const { orderId, payment } = input;

  if (payment.state !== AWAITING_INPUT_STATE) {
    return resolveDirectOutcome(input);
  }

  if (typeof payment.paymentAttemptId !== "number" || payment.paymentAttemptId <= 0) {
    return { kind: "error", message: "Resposta inválida ao concluir o pedido." };
  }

  return {
    kind: "requires_payment_input",
    orderId,
    paymentAttemptId: payment.paymentAttemptId,
    configurationVersion: payment.configurationVersion ?? "",
  };
}

/**
 * Decide o que fazer após o place-order ou a continuação. Pedido criado encerra o checkout:
 * cartão recusado vira erro; PIX/boleto pendentes seguem para a página de pagamento. No
 * Mercado Pago, `pending` é redirect ao Checkout Pro (nunca recusa); coleta pendente pede os
 * dados Pagar.me na mesma tentativa. Só `paid`/`captured` do servidor confirmam.
 */
export function resolveCheckoutOutcome(result: OutcomeInput): CheckoutOutcome {
  if (result.payment.flow === "redirect") {
    return resolveRedirectOutcome(result);
  }

  if (result.payment.flow === "requires_payment_input") {
    return resolveRequiresInputOutcome(result);
  }

  return resolveDirectOutcome(result);
}
