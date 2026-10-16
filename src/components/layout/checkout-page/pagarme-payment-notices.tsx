import type { UseCheckoutPaymentFormReturn } from "@/features/checkout/hooks/use-checkout-payment-form";
import type { PaymentConstraints } from "@/features/checkout/utils/payment-constraints";

import { CheckoutNotice } from "./checkout-notice";

type PagarmePaymentNoticesProps = {
  paymentForm: UseCheckoutPaymentFormReturn;
  constraints: PaymentConstraints;
  paymentError: string;
  pending: boolean;
};

function formatMinimum(cents: number) {
  return cents / 100 >= 1 ? `R$ ${(cents / 100).toFixed(2).replace(".", ",")}` : "R$ 0,01";
}

/** Avisos do formulário Pagar.me: erro de envio, mínimos, parcelas, cartão tokenizado e campos faltando. */
export function PagarmePaymentNotices({ paymentForm, constraints, paymentError, pending }: Readonly<PagarmePaymentNoticesProps>) {
  const { method, form, draft, canContinue } = paymentForm;
  const showStoredCard = method === "credit_card" && Boolean(form.cardTokenId) && !draft.cardNumber;

  return (
    <>
      <CheckoutNotice show={Boolean(paymentError)} tone="error">
        {paymentError}
      </CheckoutNotice>
      <CheckoutNotice show={!constraints.amountAllowed} tone="warning">
        O total mínimo para esta forma de pagamento é {formatMinimum(constraints.methodMinimumCents)}.
      </CheckoutNotice>
      <CheckoutNotice show={!constraints.installmentAllowed} tone="warning">
        Escolha no máximo {constraints.maxInstallments}x para respeitar o valor mínimo por parcela.
      </CheckoutNotice>
      <CheckoutNotice show={showStoredCard} tone="info">
        Cartão tokenizado com final {form.cardLast4 || "----"}.
      </CheckoutNotice>
      <CheckoutNotice show={!canContinue && !pending} tone="warning">
        Informe nome impresso, número do cartão, validade, CVV e o parcelamento para continuar.
      </CheckoutNotice>
    </>
  );
}
