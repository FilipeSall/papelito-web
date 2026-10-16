"use client";

import { useCheckoutStore } from "@/features/checkout";

import { BRAZIL_STATES } from "./checkout-constants";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutField } from "./checkout-field";

/**
 * Endereço de cobrança do cartão Pagar.me, lido e gravado no store do checkout. Com "usar o
 * endereço de entrega" marcado nada é enviado e o backend usa o endereço do pedido.
 */
export function PagarmeBillingAddressFields() {
  const useDeliveryAddressForBilling = useCheckoutStore((state) => state.useDeliveryAddressForBilling);
  const billingAddress = useCheckoutStore((state) => state.billingAddressForm);
  const setBillingAddressField = useCheckoutStore((state) => state.setBillingAddressField);
  const setUseDeliveryAddressForBilling = useCheckoutStore((state) => state.setUseDeliveryAddressForBilling);

  return (
    <fieldset className="mt-6 border-t border-[#E5E7EB] pt-5">
      <legend className="text-sm font-black uppercase tracking-[0.6px] text-brand-dark">
        Endereço de cobrança do cartão
      </legend>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
        <input
          checked={useDeliveryAddressForBilling}
          type="checkbox"
          onChange={(event) => setUseDeliveryAddressForBilling(event.target.checked)}
        />
        Usar o endereço de entrega
      </label>

      {useDeliveryAddressForBilling ? null : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <CheckoutField label="CEP" placeholder="00000-000" value={billingAddress.zipCode} onChange={(value) => setBillingAddressField("zipCode", value)} />
          <CheckoutField label="Rua / Logradouro" placeholder="Nome da rua" value={billingAddress.street} onChange={(value) => setBillingAddressField("street", value)} />
          <CheckoutField label="Número" placeholder="Ex: 123" value={billingAddress.number} onChange={(value) => setBillingAddressField("number", value)} />
          <CheckoutField label="Complemento" placeholder="Apto, bloco... (opcional)" value={billingAddress.complement} onChange={(value) => setBillingAddressField("complement", value)} />
          <CheckoutField label="Bairro" placeholder="Nome do bairro" value={billingAddress.neighborhood} onChange={(value) => setBillingAddressField("neighborhood", value)} />
          <CheckoutField label="Cidade" placeholder="Nome da cidade" value={billingAddress.city} onChange={(value) => setBillingAddressField("city", value)} />
          <CheckoutCustomSelect label="Estado" options={BRAZIL_STATES} placeholder="Selecione" value={billingAddress.state} onChange={(value) => setBillingAddressField("state", value)} />
        </div>
      )}
    </fieldset>
  );
}
