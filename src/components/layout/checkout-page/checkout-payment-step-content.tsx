"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import { useCheckoutPaymentForm } from "@/features/checkout";
import type { PaymentMethod } from "@/features/checkout";
import { INSTALLMENT_OPTIONS } from "./checkout-constants";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutField } from "./checkout-field";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import { PaymentMethodOption } from "./payment-method-option";

const PAYMENT_METHOD_OPTIONS: {
  id: PaymentMethod;
  label: string;
  iconSrc: string;
  iconAlt: string;
}[] = [
  {
    id: "credit_card",
    label: "Cartao",
    iconSrc: "/images/icons/cartao.svg",
    iconAlt: "Icone de cartao",
  },
  {
    id: "pix",
    label: "Pix",
    iconSrc: "/images/icons/pix.svg",
    iconAlt: "Icone de pix",
  },
  {
    id: "boleto",
    label: "Boleto",
    iconSrc: "/images/icons/barra.svg",
    iconAlt: "Icone de boleto",
  },
];

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
      <CheckoutHeader
        backHref="/checkout"
        backLabel="Voltar para endereco"
        currentStep={2}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[36px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Forma de pagamento
            </h2>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <PaymentMethodOption
                  iconAlt={option.iconAlt}
                  iconSrc={option.iconSrc}
                  key={option.id}
                  label={option.label}
                  selected={method === option.id}
                  onClick={() => setMethod(option.id)}
                />
              ))}
            </div>

            {method === "credit_card" && (
              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <CheckoutField
                    label="Nome no cartao"
                    placeholder="Nome como impresso no cartao"
                    value={form.holderName}
                    onChange={(value) => updateField("holderName", value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <CheckoutField
                    label="Numero do cartao"
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    maxLength={19}
                    value={form.cardNumber}
                    onChange={handleCardNumberChange}
                  />
                </div>

                <CheckoutField
                  label="Validade"
                  placeholder="MM/AA"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.expiryDate}
                  onChange={handleExpiryDateChange}
                />

                <CheckoutField
                  label="CVV"
                  placeholder="000"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.cvv}
                  onChange={handleCvvChange}
                />

                <div className="md:col-span-2">
                  <CheckoutCustomSelect
                    label="Parcelamento"
                    options={INSTALLMENT_OPTIONS}
                    placeholder="Selecione as parcelas"
                    value={form.installments}
                    onChange={(value) => updateField("installments", value)}
                  />
                </div>
              </div>
            )}

            {method === "pix" && (
              <div className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-bg-light px-4 py-4">
                <p className="text-sm leading-5 tracking-[-0.1504px] text-text-secondary">
                  O QR Code do Pix sera gerado na proxima etapa para pagamento imediato.
                </p>
              </div>
            )}

            {method === "boleto" && (
              <div className="mt-6 rounded-[14px] border border-[#E5E7EB] bg-bg-light px-4 py-4">
                <p className="text-sm leading-5 tracking-[-0.1504px] text-text-secondary">
                  O boleto bancario sera gerado na revisao final. Compensacao em ate 3 dias uteis.
                </p>
              </div>
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
