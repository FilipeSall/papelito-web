import type { PaymentMethod } from "../types/checkout";

/** Limites que o pricing do backend publica para os meios Pagar.me. */
export type PaymentRestrictions = {
  creditCardMinimumCents?: number;
  pixMinimumCents?: number;
  boletoMinimumCents?: number;
  maxInstallments?: number;
};

type PaymentConstraintsInput = {
  method: PaymentMethod;
  installments: string;
  totalCents: number | null;
  restrictions?: PaymentRestrictions | null;
};

/** Resultado de `paymentConstraints`, já pronto para os avisos da tela. */
export type PaymentConstraints = {
  methodMinimumCents: number;
  amountAllowed: boolean;
  maxInstallments: number;
  installmentAllowed: boolean;
};

function methodMinimum(method: PaymentMethod, restrictions?: PaymentRestrictions | null) {
  if (method === "credit_card") return restrictions?.creditCardMinimumCents ?? 100;
  if (method === "pix") return restrictions?.pixMinimumCents ?? 1;

  return restrictions?.boletoMinimumCents ?? 1;
}

/**
 * Mínimo por método e teto de parcelas para orientar o comprador antes de cobrar. É só
 * experiência: o backend recusa de novo. Sem total conhecido (`null`) o valor não bloqueia.
 */
export function paymentConstraints({ method, installments, totalCents, restrictions }: PaymentConstraintsInput): PaymentConstraints {
  const minimum = methodMinimum(method, restrictions);
  const maxInstallments = restrictions?.maxInstallments ?? 6;
  const installmentCount = Number.parseInt(installments, 10) || 1;

  return {
    methodMinimumCents: minimum,
    amountAllowed: totalCents === null || totalCents >= minimum,
    maxInstallments,
    installmentAllowed: method !== "credit_card" || installmentCount <= maxInstallments,
  };
}
