"use client";

import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import { useCheckoutAddressForm } from "@/features/checkout";
import { BRAZIL_STATES } from "./checkout-constants";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutField } from "./checkout-field";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";

export function CheckoutAddressStepContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  const {
    form,
    isFormValid,
    cepLoading,
    cepError,
    updateField,
    handleZipCodeChange,
    handleNumberChange,
  } = useCheckoutAddressForm();

  if (items.length === 0) return <CheckoutEmptyCart />;

  return (
    <main className="bg-bg-light">
      <CheckoutHeader backHref="/carrinho" backLabel="Voltar para carrinho" currentStep={1} />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,299px)]">
          <form className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <h2 className="text-[20px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
              Endereco de entrega
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
              <CheckoutField
                label="CEP"
                placeholder="00000-000"
                value={form.zipCode}
                isLoading={cepLoading}
                errorMessage={cepError}
                onChange={handleZipCodeChange}
              />

              <div className="hidden md:block" />

              <div className="md:col-span-2">
                <CheckoutField
                  label="Rua / Logradouro"
                  placeholder="Nome da rua"
                  value={form.street}
                  onChange={(value) => updateField("street", value)}
                />
              </div>

              <CheckoutField
                label="Numero"
                placeholder="Ex: 123"
                value={form.number}
                onChange={handleNumberChange}
              />

              <CheckoutField
                label="Complemento"
                placeholder="Apto, bloco... (opcional)"
                value={form.complement}
                onChange={(value) => updateField("complement", value)}
              />

              <CheckoutField
                label="Bairro"
                placeholder="Nome do bairro"
                value={form.neighborhood}
                onChange={(value) => updateField("neighborhood", value)}
              />

              <CheckoutField
                label="Cidade"
                placeholder="Nome da cidade"
                value={form.city}
                onChange={(value) => updateField("city", value)}
              />

              <CheckoutCustomSelect
                label="Estado"
                options={BRAZIL_STATES}
                placeholder="Selecione"
                value={form.state}
                onChange={(value) => updateField("state", value)}
              />
            </div>

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isFormValid}
              onClick={() => router.push("/checkout/pagamento")}
            >
              Proximo: Pagamento
              <ArrowRightIcon className="h-4.5 w-4.5" size={18} strokeWidth={1.8} />
            </button>
          </form>

          <CheckoutOrderSummary />
        </div>
      </section>
    </main>
  );
}
