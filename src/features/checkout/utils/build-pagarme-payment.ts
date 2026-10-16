import type { PaymentBillingAddress, PaymentForm, PaymentMethod, PlaceOrderPaymentInput } from "../types/checkout";

type BuildPagarmePaymentInput = {
  method: PaymentMethod;
  form: PaymentForm;
  /** Omitido, o backend usa o endereço de entrega do pedido como cobrança. */
  billingAddress?: PaymentBillingAddress;
};

/**
 * Pagamento Pagar.me a enviar: Pix e boleto levam só o método; cartão leva o token já gerado no
 * navegador, titular, parcelas e cobrança. Nunca recebe número nem CVV.
 */
export function buildPagarmePayment({ method, form, billingAddress }: BuildPagarmePaymentInput): PlaceOrderPaymentInput {
  if (method !== "credit_card") {
    return { method };
  }

  return {
    method,
    installments: Number.parseInt(form.installments, 10) || 1,
    cardTokenId: form.cardTokenId,
    holderName: form.holderName,
    billingAddress,
  };
}
