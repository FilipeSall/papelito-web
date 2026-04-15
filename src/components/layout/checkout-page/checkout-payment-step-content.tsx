"use client";

import { useRouter } from "next/navigation";
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

  const {
    method,
    setMethod,
    form,
    canContinue,
    updateField,
    handleCardNumberChange,
    handleExpiryDateChange,
    handleCvvChange,
  } = useCheckoutPaymentForm();

  if (items.length === 0) return <CheckoutEmptyCart />;

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
                cardNumber={form.cardNumber}
                expiryDate={form.expiryDate}
                cvv={form.cvv}
                installments={form.installments}
                onHolderNameChange={(value) => updateField("holderName", value)}
                onCardNumberChange={handleCardNumberChange}
                onExpiryDateChange={handleExpiryDateChange}
                onCvvChange={handleCvvChange}
                onInstallmentsChange={(value) => updateField("installments", value)}
              />
            )}

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canContinue}
              onClick={() => router.push("/checkout/revisao")}
            >
              Proximo: Revisao
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>
          </form>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
