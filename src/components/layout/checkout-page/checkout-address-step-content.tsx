"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useCartStore } from "@/features/cart";
import { getShippingQuote, useCheckoutAddressForm, useCheckoutStore } from "@/features/checkout";
import { formatBRL } from "@/lib/format-currency";
import { BRAZIL_STATES } from "./checkout-constants";
import { CheckoutCustomSelect } from "./checkout-custom-select";
import { CheckoutEmptyCart } from "./checkout-empty-cart";
import { CheckoutField } from "./checkout-field";
import { CheckoutHeader } from "./checkout-header";
import { CheckoutOrderSummary } from "./checkout-order-summary";

type ShippingStatus = "idle" | "loading" | "success" | "error";
type ShippingQuoteKey = readonly [
  "shippingQuote",
  number,
  string,
  string,
];

function resolveCartVendorId(items: ReturnType<typeof useCartStore.getState>["items"]) {
  const vendorIds = items
    .map((item) => item.vendorId)
    .filter((vendorId): vendorId is number => typeof vendorId === "number" && vendorId > 0);
  const uniqueVendorIds = new Set(vendorIds);

  return vendorIds.length === items.length && uniqueVendorIds.size === 1
    ? vendorIds[0]
    : null;
}

export function CheckoutAddressStepContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const selectedShippingQuote = useCheckoutStore((state) => state.selectedShippingQuote);
  const setSelectedShippingQuote = useCheckoutStore((state) => state.setSelectedShippingQuote);

  const {
    form,
    isFormValid,
    cepLoading,
    cepError,
    updateField,
    handleZipCodeChange,
    handleNumberChange,
  } = useCheckoutAddressForm();

  const destinationCep = form.zipCode.replace(/\D/g, "");
  const vendorId = useMemo(() => resolveCartVendorId(items), [items]);
  const quoteItems = useMemo(
    () =>
      items
        .map((item) => ({
          productId: Number(item.id),
          qty: item.quantity,
        }))
        .filter((item) => Number.isInteger(item.productId) && item.productId > 0),
    [items],
  );
  const quoteItemsKey = useMemo(
    () =>
      items
        .map((item) => `${item.id}:${item.quantity}`)
        .sort()
        .join("|"),
    [items],
  );
  const shouldQuoteShipping =
    Boolean(vendorId) &&
    destinationCep.length === 8 &&
    items.length > 0 &&
    quoteItems.length === items.length;
  const shippingQuoteKey: ShippingQuoteKey | null =
    shouldQuoteShipping && vendorId
      ? ["shippingQuote", vendorId, destinationCep, quoteItemsKey]
      : null;
  const shippingQuote = useSWR(
    shippingQuoteKey,
    ([, currentVendorId, currentDestinationCep]) =>
      getShippingQuote({
        vendorId: currentVendorId,
        destinationCep: currentDestinationCep,
        items: quoteItems,
      }),
    {
      onError: () => setSelectedShippingQuote(null),
      onSuccess: (result) => {
        if (!selectedShippingQuote) {
          return;
        }

        const hasSelectedOption = result.options.some(
          (option) => option.code === selectedShippingQuote.code,
        );

        if (!hasSelectedOption) {
          setSelectedShippingQuote(null);
        }
      },
      revalidateOnFocus: false,
    },
  );
  const shippingOptions = shippingQuote.data?.options ?? [];
  const invalidProductIdsForShipping =
    vendorId && destinationCep.length === 8 && quoteItems.length !== items.length;
  const shippingStatus: ShippingStatus = invalidProductIdsForShipping
    ? "error"
    : shippingQuote.isLoading
      ? "loading"
      : shippingQuote.error
        ? "error"
        : shippingOptions.length > 0
          ? "success"
          : "idle";
  const shippingError =
    invalidProductIdsForShipping
      ? "Carrinho contem produtos sem identificador valido para cotar frete."
      : shippingQuote.error instanceof Error
        ? shippingQuote.error.message
        : null;
  const shouldBlockForShipping =
    shouldQuoteShipping && (shippingStatus !== "success" || !selectedShippingQuote);

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

            <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <p className="text-xs font-black uppercase tracking-[0.6px] text-brand-dark">
                Frete Correios
              </p>

              {!vendorId ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  A cotacao por vendor sera ativada quando o carrinho carregar o vendor escolhido.
                </p>
              ) : destinationCep.length !== 8 ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  Informe um CEP valido para cotar PAC e SEDEX.
                </p>
              ) : shippingStatus === "loading" ? (
                <p className="mt-2 text-sm leading-5 text-text-tertiary">
                  Cotando frete nos Correios...
                </p>
              ) : shippingStatus === "error" ? (
                <p className="mt-2 text-sm leading-5 text-[#B42318]">
                  {shippingError ?? "Nao foi possivel cotar o frete."}
                </p>
              ) : shippingOptions.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {shippingOptions.map((option) => {
                    const isSelected = selectedShippingQuote?.code === option.code;

                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-brand-dark bg-white shadow-sm"
                            : "border-[#E5E7EB] bg-white/70 hover:border-brand-dark/30"
                        }`}
                        onClick={() => setSelectedShippingQuote(option)}
                      >
                        <span>
                          <span className="block text-sm font-black text-brand-dark">
                            {option.service}
                          </span>
                          <span className="block text-xs text-text-tertiary">
                            {option.deliveryTime
                              ? `${option.deliveryTime} dias uteis`
                              : "Prazo sob consulta"}
                          </span>
                        </span>
                        <span className="text-sm font-black text-brand-dark">
                          {formatBRL(option.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow text-base font-black uppercase tracking-[-0.3125px] text-brand-dark transition enabled:cursor-pointer enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isFormValid || shouldBlockForShipping}
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
