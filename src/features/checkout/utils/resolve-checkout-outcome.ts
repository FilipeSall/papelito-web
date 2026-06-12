import type { PaymentMethod } from "../types/checkout";

export type CheckoutOutcome =
  | { kind: "error"; message: string }
  | { kind: "confirmed"; orderId: string | number }
  | { kind: "pending"; orderId: string | number };

const PAID_STATES = new Set(["paid", "captured"]);

/**
 * Decide o que fazer apos o place-order. Invariante de negocio:
 * o carrinho so deve ser limpo (kind "confirmed") quando o pagamento
 * estiver realmente aprovado. Cartao recusado vira erro; PIX/boleto sem
 * confirmacao ficam "pending" (carrinho preservado, pagina de pagamento).
 */
export function resolveCheckoutOutcome(result: {
  orderId: string | number;
  payment: { method: PaymentMethod; state?: string };
}): CheckoutOutcome {
  const paymentConfirmed = PAID_STATES.has(result.payment.state ?? "");

  if (result.payment.method === "credit_card" && !paymentConfirmed) {
    return {
      kind: "error",
      message: "Pagamento recusado. Revise os dados ou tente outro metodo.",
    };
  }

  if (paymentConfirmed) {
    return { kind: "confirmed", orderId: result.orderId };
  }

  return { kind: "pending", orderId: result.orderId };
}
