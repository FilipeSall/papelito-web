"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import { useCheckoutPaymentForm } from "@/features/checkout";
import { PAYMENT_METHOD_OPTIONS } from "./checkout-constants";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { CreditCardFormFields } from "./credit-card-form-fields";
import { PaymentMethodOption } from "./payment-method-option";

export function CheckoutPaymentStepContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const pricing = useCartStore((state) => state.pricing);
  const pricingError = useCartStore((state) => state.pricingError);
  const pricingRequiresConfirmation = useCartStore(
    (state) => state.pricingRequiresConfirmation,
  );
  const [paymentError, setPaymentError] = useState("");
  const [pending, startTransition] = useTransition();

  const {
    method,
    setMethod,
    form,
    draft,
    canContinue,
    updateField,
    handleCardNumberChange,
    handleExpiryDateChange,
    handleCvvChange,
    prepareCardToken,
  } = useCheckoutPaymentForm();

  const restrictions = pricing?.paymentRestrictions;
  const totalCents = pricing?.totals.totalCents ?? 0;
  const methodMinimum =
    method === "credit_card"
      ? restrictions?.creditCardMinimumCents ?? 100
      : method === "pix"
        ? restrictions?.pixMinimumCents ?? 1
        : restrictions?.boletoMinimumCents ?? 1;
  const amountAllowed = !pricing || totalCents >= methodMinimum;
  const installmentCount = Number.parseInt(form.installments, 10) || 1;
  const maxInstallments = restrictions?.maxInstallments ?? 6;
  const installmentAllowed = method !== "credit_card" || installmentCount <= maxInstallments;

  if (items.length === 0) return <CheckoutEmptyCart />;

  function goToReview() {
    setPaymentError("");

    startTransition(async () => {
      try {
        await prepareCardToken();
        router.push("/checkout/revisao");
      } catch (error) {
        setPaymentError(
          error instanceof Error ? error.message : "Nao foi possivel preparar o pagamento.",
        );
      }
    });
  }

  return (
    <main className="bg-bg-light">
      <CheckoutHeader backHref="/checkout" backLabel="Voltar para endereco" currentStep={2} />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[36px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Forma de pagamento
            </h2>

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

            {method === "credit_card" && (
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
            )}

            {paymentError ? (
              <p className="mt-4 rounded-[12px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B42318]">
                {paymentError}
              </p>
            ) : null}

            {!amountAllowed ? (
              <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                O total mínimo para esta forma de pagamento é {methodMinimum / 100 >= 1 ? `R$ ${(methodMinimum / 100).toFixed(2).replace(".", ",")}` : "R$ 0,01"}.
              </p>
            ) : null}

            {!installmentAllowed ? (
              <p className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                Escolha no máximo {maxInstallments}x para respeitar o valor mínimo por parcela.
              </p>
            ) : null}

            {method === "credit_card" && form.cardTokenId && !draft.cardNumber ? (
              <p className="mt-4 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs text-[#1D4ED8]">
                Cartao tokenizado com final {form.cardLast4 || "----"}.
              </p>
            ) : null}

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canContinue ||
                pending ||
                !amountAllowed ||
                !installmentAllowed ||
                Boolean(pricingError) ||
                pricingRequiresConfirmation
              }
              onClick={goToReview}
            >
              {pending ? "Preparando pagamento..." : "Proximo: Revisao"}
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>
          </form>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
