"use client";

import type { UseCheckoutPaymentFormReturn } from "@/features/checkout/hooks/use-checkout-payment-form";

import { PAYMENT_METHOD_OPTIONS } from "./checkout-constants";
import { CreditCardFormFields } from "./credit-card-form-fields";
import { PagarmeBillingAddressFields } from "./pagarme-billing-address-fields";
import { PaymentMethodOption } from "./payment-method-option";

type PagarmePaymentFieldsProps = {
  /** Retorno de `useCheckoutPaymentForm` no componente que também tokeniza e envia. */
  paymentForm: UseCheckoutPaymentFormReturn;
  maxInstallments: number;
};

/**
 * Seleção de método e dados do cartão Pagar.me. Serve à etapa de pagamento e à coleta da
 * tentativa que ficou aguardando dados; o cartão só vira token no envio, nunca aqui.
 */
export function PagarmePaymentFields({ paymentForm, maxInstallments }: Readonly<PagarmePaymentFieldsProps>) {
  const { method, setMethod, form, draft, updateField, handleCardNumberChange, handleExpiryDateChange, handleCvvChange } = paymentForm;

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {PAYMENT_METHOD_OPTIONS.map((option) => (
          <PaymentMethodOption
            key={option.id}
            iconAlt={option.iconAlt}
            iconSrc={option.iconSrc}
            label={option.label}
            selected={method === option.id}
            onClick={() => setMethod(option.id)}
          />
        ))}
      </div>

      {method === "credit_card" ? (
        <>
          <CreditCardFormFields
            holderName={form.holderName}
            cardNumber={draft.cardNumber}
            expiryDate={draft.expiryDate}
            cvv={draft.cvv}
            installments={form.installments}
            maxInstallments={maxInstallments}
            onHolderNameChange={(value) => updateField("holderName", value)}
            onCardNumberChange={handleCardNumberChange}
            onExpiryDateChange={handleExpiryDateChange}
            onCvvChange={handleCvvChange}
            onInstallmentsChange={(value) => updateField("installments", value)}
          />
          <PagarmeBillingAddressFields />
        </>
      ) : null}
    </>
  );
}
